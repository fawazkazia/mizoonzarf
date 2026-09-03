"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { variantAttrs } from "@/lib/inventory/variant-attributes";
import type { ScanContext } from "@/generated/prisma/client";

/** Variants with no barcode yet, matching a product name or SKU — feeds the "Assign Barcode" flow when a scan comes back not-found. */
export async function searchVariantsForAssignment(query: string) {
  await requirePermission("inventory.view");
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const variants = await db.productVariant.findMany({
    where: {
      barcode: null,
      OR: [{ sku: { contains: trimmed, mode: "insensitive" } }, { product: { name: { contains: trimmed, mode: "insensitive" } } }],
    },
    include: { product: { select: { name: true } } },
    take: 8,
  });

  return variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    attributes: variantAttrs(v),
    productName: v.product.name,
  }));
}

export async function lookupBarcode(code: string, context: ScanContext = "GENERAL_SEARCH") {
  const session = await requirePermission("inventory.view");
  const trimmed = code.trim();
  if (!trimmed) throw new Error("Enter or scan a barcode.");

  const variant = await db.productVariant.findUnique({
    where: { barcode: trimmed },
    include: {
      product: { select: { id: true, name: true, slug: true, sku: true, status: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
      warehouseStocks: { include: { warehouse: true } },
    },
  });

  await db.barcodeScanLog.create({
    data: { barcode: trimmed, variantId: variant?.id, found: !!variant, context, userId: session.user.id },
  });

  if (!variant) return null;

  return {
    variant: {
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode,
      barcodeType: variant.barcodeType,
      attributes: variantAttrs(variant),
      price: Number(variant.price),
      salePrice: variant.salePrice ? Number(variant.salePrice) : null,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      imageUrl: variant.imageUrl,
    },
    product: variant.product,
    warehouseStocks: variant.warehouseStocks.map((ws) => ({
      warehouseId: ws.warehouseId,
      warehouseName: ws.warehouse.name,
      quantity: ws.quantity,
    })),
  };
}
