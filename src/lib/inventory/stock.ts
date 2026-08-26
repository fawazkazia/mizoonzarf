import type { Prisma, StockMovementType } from "@/generated/prisma/client";

/**
 * Applies a signed stock delta to a variant, keeping three things in sync inside
 * one transaction: the per-warehouse breakdown, the denormalized `ProductVariant.stock`
 * total (the number the storefront/cart/checkout already read — untouched by this
 * feature otherwise), and an immutable `StockMovement` ledger row.
 */
export async function applyStockMovement(
  tx: Prisma.TransactionClient,
  params: {
    variantId: string;
    warehouseId: string;
    type: StockMovementType;
    delta: number;
    reason?: string;
    referenceType?: string;
    referenceId?: string;
    userId?: string;
    /**
     * Also enforce the guard at the per-warehouse level, not just the variant's global total —
     * required for transfers, where the source warehouse's *local* quantity is what must cover
     * the move even if other warehouses hold enough stock to satisfy the global-total check alone.
     */
    requireWarehouseStock?: boolean;
  }
) {
  // Atomic, race-safe under concurrent calls: the DB itself performs the read-modify-write as
  // one locked row operation, instead of this code reading `stock` and writing a computed literal
  // back (which would lose updates if two movements for the same variant commit concurrently).
  let newStock: number;
  if (params.delta < 0) {
    // updateMany's WHERE is evaluated against the row *at update time*, under the row lock it takes —
    // so "enough stock to cover this decrement" and "decrement it" happen as one atomic step.
    const result = await tx.productVariant.updateMany({
      where: { id: params.variantId, stock: { gte: -params.delta } },
      data: { stock: { increment: params.delta } },
    });
    if (result.count === 0) {
      const current = await tx.productVariant.findUniqueOrThrow({ where: { id: params.variantId }, select: { stock: true } });
      throw new Error(`Not enough stock: ${current.stock} on hand, tried to remove ${-params.delta}.`);
    }
    newStock = (await tx.productVariant.findUniqueOrThrow({ where: { id: params.variantId }, select: { stock: true } })).stock;
  } else {
    newStock = (
      await tx.productVariant.update({ where: { id: params.variantId }, data: { stock: { increment: params.delta } }, select: { stock: true } })
    ).stock;
  }
  const previousStock = newStock - params.delta;

  if (params.delta < 0 && params.requireWarehouseStock) {
    const guarded = await tx.variantWarehouseStock.updateMany({
      where: { variantId: params.variantId, warehouseId: params.warehouseId, quantity: { gte: -params.delta } },
      data: { quantity: { decrement: -params.delta } },
    });
    if (guarded.count === 0) {
      const current = await tx.variantWarehouseStock.findUnique({
        where: { variantId_warehouseId: { variantId: params.variantId, warehouseId: params.warehouseId } },
      });
      throw new Error(`Not enough stock at this warehouse: ${current?.quantity ?? 0} on hand, tried to remove ${-params.delta}.`);
    }
  } else {
    await tx.variantWarehouseStock.upsert({
      where: { variantId_warehouseId: { variantId: params.variantId, warehouseId: params.warehouseId } },
      create: { variantId: params.variantId, warehouseId: params.warehouseId, quantity: params.delta },
      update: { quantity: { increment: params.delta } },
    });
  }

  return tx.stockMovement.create({
    data: {
      variantId: params.variantId,
      warehouseId: params.warehouseId,
      type: params.type,
      quantity: params.delta,
      previousStock,
      newStock,
      reason: params.reason,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      userId: params.userId,
    },
  });
}

export async function getDefaultWarehouseId(tx: Prisma.TransactionClient): Promise<string> {
  const warehouse = await tx.warehouse.findFirst({ where: { isDefault: true } });
  if (warehouse) return warehouse.id;
  const any = await tx.warehouse.findFirst({ orderBy: { createdAt: "asc" } });
  if (!any) throw new Error("No warehouse exists yet. Create one under Inventory → Warehouses first.");
  return any.id;
}
