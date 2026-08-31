"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff, requireRole } from "@/lib/admin-auth";
import { OPERATIONS_ROLES } from "@/lib/admin-permissions";
import { sendOrderEmail } from "@/lib/notifications/order-email";
import { createNotification } from "@/lib/notifications/inapp";
import { applyStockMovement, getDefaultWarehouseId } from "@/lib/inventory/stock";
import { variantAttrs } from "@/lib/inventory/variant-attributes";
import { processRefund } from "@/lib/finance/refunds";
import type { ReturnStatus, ReturnResolution } from "@/generated/prisma/client";

/** REFUNDED is handled separately via updateOrderStatus (order_refunded), not here. */
const RETURN_STATUS_TEMPLATES: Partial<Record<ReturnStatus, string>> = {
  APPROVED: "return_approved",
  REJECTED: "return_rejected",
  PICKUP: "return_pickup",
  RECEIVED: "return_received",
  REFUND_PROCESSING: "refund_initiated",
};

/** Scans a barcode to find open returns for that variant — the entry point for the warehouse "Scan Return" workflow. */
export async function scanReturnItem(barcode: string) {
  const session = await requireStaff();
  const trimmed = barcode.trim();

  const variant = await db.productVariant.findUnique({
    where: { barcode: trimmed },
    include: { product: { select: { name: true } } },
  });
  await db.barcodeScanLog.create({
    data: { barcode: trimmed, variantId: variant?.id, found: !!variant, context: "RETURN", userId: session.user.id },
  });
  if (!variant) return null;

  const items = await db.orderItem.findMany({
    where: { variantId: variant.id },
    include: {
      order: { select: { id: true, orderNumber: true, createdAt: true, guestEmail: true, user: { select: { name: true, email: true } } } },
      returns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { order: { createdAt: "desc" } },
    take: 10,
  });

  return {
    variant: { id: variant.id, sku: variant.sku, attributes: variantAttrs(variant), productName: variant.product.name },
    matches: items.map((item) => ({
      orderItemId: item.id,
      orderId: item.order.id,
      orderNumber: item.order.orderNumber,
      purchaseDate: item.order.createdAt,
      customer: item.order.user?.name ?? item.order.user?.email ?? item.order.guestEmail ?? "Guest",
      existingReturn: item.returns[0]
        ? { id: item.returns[0].id, status: item.returns[0].status, resolution: item.returns[0].resolution }
        : null,
    })),
  };
}

/**
 * Resolves a physically-received return item: RESTOCK writes a StockMovement and puts
 * the unit back on the shelf; REFUND delegates to updateReturnStatus so loyalty-reversal
 * and customer notification logic isn't duplicated; the rest just record the outcome for
 * manual follow-up. Works whether a Return record already exists (customer-requested) or
 * not (walk-in/mail item scanned in for the first time).
 */
export async function resolveReturn(
  input: { returnId?: string; orderItemId?: string; resolution: ReturnResolution; warehouseId?: string; refundAmount?: number; adminNote?: string }
) {
  const session = await requireRole(OPERATIONS_ROLES);
  if (!input.returnId && !input.orderItemId) throw new Error("Missing return or order item reference.");

  let returnRecord = input.returnId
    ? await db.return.findUniqueOrThrow({ where: { id: input.returnId }, include: { orderItem: true } })
    : null;

  if (!returnRecord) {
    const orderItem = await db.orderItem.findUniqueOrThrow({ where: { id: input.orderItemId! } });
    returnRecord = await db.return.create({
      data: { orderId: orderItem.orderId, orderItemId: orderItem.id, reason: "Scanned in at receiving", status: "RECEIVED" },
      include: { orderItem: true },
    });
  }

  if (input.resolution === "REFUND") {
    // updateReturnStatus throws (and writes nothing) if this return was already refunded — only
    // record the resolution once that guard has actually let the refund through, so a rejected
    // duplicate-refund attempt can't leave the return's resolution field mutated on its own.
    await updateReturnStatus(returnRecord.id, "REFUNDED", { refundAmount: input.refundAmount, adminNote: input.adminNote });
    await db.return.update({ where: { id: returnRecord.id }, data: { resolution: "REFUND" } });
    return;
  }

  await db.$transaction(async (tx) => {
    if (input.resolution === "RESTOCK" && returnRecord!.orderItem?.variantId) {
      const warehouseId = input.warehouseId ?? (await getDefaultWarehouseId(tx));
      await applyStockMovement(tx, {
        variantId: returnRecord!.orderItem.variantId,
        warehouseId,
        type: "RETURN_RESTOCK",
        delta: 1,
        reason: "Return restocked at receiving",
        referenceType: "RETURN",
        referenceId: returnRecord!.id,
        userId: session.user.id,
      });
    }
    if (input.resolution === "DAMAGED" && returnRecord!.orderItem?.variantId) {
      const warehouseId = input.warehouseId ?? (await getDefaultWarehouseId(tx));
      const currentStock = (await tx.productVariant.findUniqueOrThrow({
        where: { id: returnRecord!.orderItem.variantId },
        select: { stock: true },
      })).stock;
      await tx.stockMovement.create({
        data: {
          variantId: returnRecord!.orderItem.variantId,
          warehouseId,
          type: "RETURN_DAMAGED",
          quantity: 0,
          previousStock: currentStock,
          newStock: currentStock,
          reason: "Returned item marked damaged — not restocked",
          referenceType: "RETURN",
          referenceId: returnRecord!.id,
          userId: session.user.id,
        },
      });
    }

    await tx.return.update({
      where: { id: returnRecord!.id },
      data: {
        resolution: input.resolution,
        warehouseId: input.warehouseId,
        restockedAt: input.resolution === "RESTOCK" ? new Date() : undefined,
        adminNote: input.adminNote ?? returnRecord!.adminNote,
        status: input.resolution === "INSPECTION_REQUIRED" ? "RECEIVED" : returnRecord!.status,
      },
    });
  });

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${returnRecord.id}`);
  revalidatePath("/admin/inventory");
}

export async function updateReturnStatus(
  returnId: string,
  status: ReturnStatus,
  data: { adminNote?: string; refundAmount?: number } = {}
) {
  const session = await requireStaff();

  const existing = await db.return.findUnique({ where: { id: returnId }, include: { order: true } });
  if (!existing) throw new Error("Return not found.");
  if (existing.status === "REFUNDED") throw new Error("This return has already been refunded.");

  // REFUNDED routes through processRefund — the same real reversal (gateway call,
  // Payment/Order.paymentStatus, loyalty reversal, ledger entry) as an order-level refund.
  // Previously this branch only wrote Return.status/refundAmount and Order.status, without
  // ever touching Payment/paymentStatus, leaving a "refunded" return that hadn't actually
  // reversed any money — processRefund itself now writes the Return row too, so it must run
  // before the generic update below (which would otherwise stomp its status/refundAmount write).
  if (status === "REFUNDED") {
    const amount = data.refundAmount ?? Number(existing.order.total);
    await processRefund({
      orderId: existing.orderId,
      returnId: existing.id,
      amount,
      reason: data.adminNote || "Refunded via return workflow.",
      requestedById: session.user.id,
    });
    revalidatePath("/admin/returns");
    revalidatePath(`/admin/returns/${returnId}`);
    revalidatePath("/account/returns");
    return;
  }

  await db.return.update({
    where: { id: returnId },
    data: {
      status,
      adminNote: data.adminNote ?? existing.adminNote,
      refundAmount: data.refundAmount ?? (existing.refundAmount ? Number(existing.refundAmount) : undefined),
    },
  });

  const contactEmail = existing.order.userId
    ? (await db.user.findUnique({ where: { id: existing.order.userId }, select: { email: true } }))?.email
    : existing.order.guestEmail;

  const templateKey = RETURN_STATUS_TEMPLATES[status];
  if (templateKey) {
    await sendOrderEmail({
      orderId: existing.orderId,
      userId: existing.order.userId,
      to: contactEmail,
      templateKey,
      variables: { order_number: existing.order.orderNumber },
    });
  }

  if (existing.order.userId) {
    await createNotification({
      userId: existing.order.userId,
      type: "RETURN_STATUS",
      title: `Return for order ${existing.order.orderNumber}`,
      body: `Your return is now ${status.replace(/_/g, " ").toLowerCase()}.`,
      link: "/account/returns",
    });
  }

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${returnId}`);
  revalidatePath("/account/returns");
}
