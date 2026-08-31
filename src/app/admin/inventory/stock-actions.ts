"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { OPERATIONS_ROLES } from "@/lib/admin-permissions";
import { applyStockMovement } from "@/lib/inventory/stock";

function revalidateStockPaths() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/movements");
  revalidatePath("/admin/products");
}

export async function stockIn(variantId: string, warehouseId: string, quantity: number, reason?: string) {
  const session = await requireRole(OPERATIONS_ROLES);
  if (quantity <= 0) throw new Error("Quantity must be positive.");
  const movement = await db.$transaction((tx) =>
    applyStockMovement(tx, { variantId, warehouseId, type: "STOCK_IN", delta: quantity, reason, userId: session.user.id })
  );
  revalidateStockPaths();
  return movement;
}

export async function stockOut(variantId: string, warehouseId: string, quantity: number, reason?: string) {
  const session = await requireRole(OPERATIONS_ROLES);
  if (quantity <= 0) throw new Error("Quantity must be positive.");
  const movement = await db.$transaction((tx) =>
    applyStockMovement(tx, { variantId, warehouseId, type: "STOCK_OUT", delta: -quantity, reason, userId: session.user.id, requireWarehouseStock: true })
  );
  revalidateStockPaths();
  return movement;
}

export async function receiveStock(variantId: string, warehouseId: string, quantity: number, reason?: string) {
  const session = await requireRole(OPERATIONS_ROLES);
  if (quantity <= 0) throw new Error("Quantity must be positive.");
  const movement = await db.$transaction((tx) =>
    applyStockMovement(tx, {
      variantId,
      warehouseId,
      type: "RECEIVE",
      delta: quantity,
      reason: reason ?? "Stock received",
      referenceType: "RECEIVING",
      userId: session.user.id,
    })
  );
  revalidateStockPaths();
  return movement;
}

export async function transferStock(variantId: string, fromWarehouseId: string, toWarehouseId: string, quantity: number, reason?: string) {
  const session = await requireRole(OPERATIONS_ROLES);
  if (quantity <= 0) throw new Error("Quantity must be positive.");
  if (fromWarehouseId === toWarehouseId) throw new Error("Source and destination warehouses must be different.");

  const transferId = crypto.randomUUID();
  await db.$transaction(async (tx) => {
    // Two linked movements, same net effect on the variant total as a no-op (−qty then +qty) —
    // only the per-warehouse breakdown actually moves. Sharing referenceId lets the ledger show them as one transfer.
    await applyStockMovement(tx, {
      variantId,
      warehouseId: fromWarehouseId,
      type: "TRANSFER_OUT",
      delta: -quantity,
      reason,
      referenceType: "TRANSFER",
      referenceId: transferId,
      userId: session.user.id,
      requireWarehouseStock: true,
    });
    await applyStockMovement(tx, {
      variantId,
      warehouseId: toWarehouseId,
      type: "TRANSFER_IN",
      delta: quantity,
      reason,
      referenceType: "TRANSFER",
      referenceId: transferId,
      userId: session.user.id,
    });
  });
  revalidateStockPaths();
}

export async function adjustStock(variantId: string, warehouseId: string, delta: number, reason: string) {
  const session = await requireRole(OPERATIONS_ROLES);
  if (delta === 0) throw new Error("Adjustment must be non-zero.");
  if (!reason.trim()) throw new Error("A reason is required for manual adjustments.");
  const movement = await db.$transaction((tx) =>
    applyStockMovement(tx, { variantId, warehouseId, type: "ADJUSTMENT", delta, reason, userId: session.user.id, requireWarehouseStock: true })
  );
  revalidateStockPaths();
  return movement;
}
