"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { updateOrderStatus } from "./actions";

export type PackScanResult =
  | { ok: true; item: { id: string; productName: string; variantLabel: string | null; sku: string; packedQuantity: number; quantity: number }; allPacked: boolean }
  | { ok: false; reason: "NOT_FOUND" | "WRONG_PRODUCT" | "ALREADY_COMPLETE" };

/** Scans one barcode against an order's still-unpacked items — never throws for a mismatch, so the UI can show "WRONG PRODUCT" inline. */
export async function scanPackItem(orderId: string, barcode: string): Promise<PackScanResult> {
  const session = await requirePermission("orders.changeStatus");
  const trimmed = barcode.trim();

  const variant = await db.productVariant.findUnique({ where: { barcode: trimmed } });
  await db.barcodeScanLog.create({
    data: { barcode: trimmed, variantId: variant?.id, found: !!variant, context: "ORDER_PACKING", userId: session.user.id },
  });
  if (!variant) return { ok: false, reason: "NOT_FOUND" };

  const item = await db.orderItem.findFirst({ where: { orderId, variantId: variant.id } });
  if (!item) return { ok: false, reason: "WRONG_PRODUCT" };
  if (item.packedQuantity >= item.quantity) return { ok: false, reason: "ALREADY_COMPLETE" };

  const updated = await db.$transaction(async (tx) => {
    await tx.order.updateMany({ where: { id: orderId, packingStartedAt: null }, data: { packingStartedAt: new Date() } });
    return tx.orderItem.update({ where: { id: item.id }, data: { packedQuantity: { increment: 1 } } });
  });

  const remaining = await db.orderItem.findMany({ where: { orderId } });
  const allPacked = remaining.every((i) => i.packedQuantity >= i.quantity);

  revalidatePath(`/admin/orders/${orderId}/pack`);

  return {
    ok: true,
    item: {
      id: updated.id,
      productName: updated.productName,
      variantLabel: updated.variantLabel,
      sku: updated.sku,
      packedQuantity: updated.packedQuantity,
      quantity: updated.quantity,
    },
    allPacked,
  };
}

export async function markOrderPacked(orderId: string) {
  await requirePermission("orders.changeStatus");
  const items = await db.orderItem.findMany({ where: { orderId } });
  const incomplete = items.filter((i) => i.packedQuantity < i.quantity);
  if (incomplete.length > 0) {
    throw new Error(`${incomplete.length} item(s) still need scanning before this order can be marked packed.`);
  }
  await updateOrderStatus(orderId, "PACKED", "All items verified by barcode scan.");
}
