"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { OPERATIONS_ROLES } from "@/lib/admin-permissions";
import { applyStockMovement } from "@/lib/inventory/stock";
import { postPOReceivedEntry } from "@/lib/finance/ledger";

/**
 * Receives a quantity against one PO line. Posts the ledger entry inside the same transaction
 * as the stock movement (unlike the customer-facing order-paid/refund paths) — nothing
 * customer-facing depends on this completing, so blocking the staff member with a clear error
 * the moment they click "Receive" is strictly better than letting a bad ledger entry through.
 */
export async function receivePurchaseOrderLine(poItemId: string, quantity: number) {
  const session = await requireRole(OPERATIONS_ROLES);
  if (quantity <= 0) throw new Error("Quantity must be positive.");

  const item = await db.purchaseOrderItem.findUniqueOrThrow({
    where: { id: poItemId },
    include: { purchaseOrder: { include: { items: true } } },
  });
  const po = item.purchaseOrder;
  if (!["SENT", "APPROVED", "PARTIALLY_RECEIVED"].includes(po.status)) {
    throw new Error("This purchase order isn't in a receivable state.");
  }
  const remaining = item.quantityOrdered - item.quantityReceived;
  if (quantity > remaining) throw new Error(`Only ${remaining} unit(s) remain to be received on this line.`);

  const amount = Number(item.unitCost) * quantity;

  await db.$transaction(async (tx) => {
    await applyStockMovement(tx, {
      variantId: item.variantId,
      warehouseId: po.warehouseId,
      type: "RECEIVE",
      delta: quantity,
      reason: `Received against PO ${po.poNumber}`,
      referenceType: "PURCHASE_ORDER",
      referenceId: po.id,
      userId: session.user.id,
    });

    // Last-cost basis: the most recently received unit cost becomes this variant's cost price.
    // Historical orders are unaffected — they carry their own frozen OrderItem.costPriceSnapshot.
    await tx.productVariant.update({ where: { id: item.variantId }, data: { costPrice: item.unitCost } });

    await tx.purchaseOrderItem.update({ where: { id: poItemId }, data: { quantityReceived: { increment: quantity } } });

    await postPOReceivedEntry(tx, {
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      amount,
      createdById: session.user.id,
    });

    const invoice = await tx.invoice.findFirst({ where: { purchaseOrderId: po.id, type: "PURCHASE" } });
    if (invoice) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { subtotal: { increment: amount }, total: { increment: amount } },
      });
    } else {
      await tx.invoice.create({
        data: {
          invoiceNumber: `PINV-${po.poNumber}`,
          type: "PURCHASE",
          status: "ISSUED",
          purchaseOrderId: po.id,
          supplierId: po.supplierId,
          issueDate: new Date(),
          subtotal: amount,
          total: amount,
        },
      });
    }

    const refreshedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });
    const allReceived = refreshedItems.every((i) => i.quantityReceived >= i.quantityOrdered);
    const anyReceived = refreshedItems.some((i) => i.quantityReceived > 0);
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status,
        receivedAt: allReceived ? new Date() : undefined,
      },
    });
  });

  revalidatePath(`/admin/purchase-orders/${po.id}`);
  revalidatePath("/admin/purchase-orders");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}
