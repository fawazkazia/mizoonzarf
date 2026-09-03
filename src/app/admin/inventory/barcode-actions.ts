"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { generateBarcodeValue, type BarcodeType } from "@/lib/barcode/generate";
import { validateBarcodeForType } from "@/lib/barcode/validate";
import type { Prisma } from "@/generated/prisma/client";

function revalidateInventoryPaths() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/barcodes");
  revalidatePath("/admin/products");
}

/** Runs inside `tx`; throws a friendly error (and logs the collision) instead of a raw P2002. */
async function setVariantBarcode(
  tx: Prisma.TransactionClient,
  variantId: string,
  barcode: string,
  type: BarcodeType,
  source: "GENERATED" | "MANUFACTURER",
  userId?: string
) {
  try {
    return await tx.productVariant.update({
      where: { id: variantId },
      data: { barcode, barcodeType: type, barcodeSource: source, barcodeGeneratedAt: new Date() },
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      await tx.barcodeDuplicateAttempt.create({ data: { barcode, variantId, userId } });
      throw new Error(`Barcode "${barcode}" is already assigned to another variant.`);
    }
    throw err;
  }
}

export async function generateBarcode(variantId: string, type: BarcodeType = "CODE128") {
  const session = await requirePermission("inventory.edit");
  const variant = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  if (variant.barcode) throw new Error("This variant already has a barcode. Use Regenerate instead.");

  const barcode = await db.$transaction(async (tx) => {
    const value = await generateBarcodeValue(tx, type);
    await setVariantBarcode(tx, variantId, value, type, "GENERATED", session.user.id);
    return value;
  });

  await logStaffActivity({ actorId: session.user.id, action: "BARCODE_GENERATED", module: "inventory", entityType: "ProductVariant", entityId: variantId, after: { barcode } });
  revalidateInventoryPaths();
  return { barcode };
}

export async function regenerateBarcode(variantId: string, type: BarcodeType = "CODE128") {
  const session = await requirePermission("inventory.edit");
  const variant = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  if (variant.barcodeSource === "MANUFACTURER") {
    throw new Error("This variant carries a manufacturer/GS1 barcode — clear it manually before regenerating.");
  }

  const barcode = await db.$transaction(async (tx) => {
    const value = await generateBarcodeValue(tx, type);
    await setVariantBarcode(tx, variantId, value, type, "GENERATED", session.user.id);
    return value;
  });

  await logStaffActivity({ actorId: session.user.id, action: "BARCODE_REGENERATED", module: "inventory", entityType: "ProductVariant", entityId: variantId, before: { barcode: variant.barcode }, after: { barcode } });
  revalidateInventoryPaths();
  return { barcode };
}

export async function bulkGenerateBarcodes(variantIds: string[], type: BarcodeType = "CODE128") {
  const session = await requirePermission("inventory.edit");
  if (variantIds.length === 0) throw new Error("No variants selected.");

  const variants = await db.productVariant.findMany({ where: { id: { in: variantIds } } });
  await db.$transaction(async (tx) => {
    for (const variant of variants) {
      if (variant.barcode) continue;
      const value = await generateBarcodeValue(tx, type);
      await setVariantBarcode(tx, variant.id, value, type, "GENERATED", session.user.id);
    }
  });

  const generated = variants.filter((v) => !v.barcode).length;
  await logStaffActivity({ actorId: session.user.id, action: "BARCODES_BULK_GENERATED", module: "inventory", entityType: "ProductVariant", after: { count: generated } });
  revalidateInventoryPaths();
  return { generated };
}

export async function assignManufacturerBarcode(variantId: string, code: string, type: BarcodeType) {
  const session = await requirePermission("inventory.edit");
  const trimmed = code.trim();
  if (!validateBarcodeForType(trimmed, type)) {
    throw new Error(`"${trimmed}" is not a valid ${type.replace("_", "-")} number (check digit mismatch).`);
  }

  await db.$transaction(async (tx) => {
    await setVariantBarcode(tx, variantId, trimmed, type, "MANUFACTURER", session.user.id);
  });

  await logStaffActivity({ actorId: session.user.id, action: "BARCODE_ASSIGNED", module: "inventory", entityType: "ProductVariant", entityId: variantId, after: { barcode: trimmed, type } });
  revalidateInventoryPaths();
}

export async function deactivateBarcode(variantId: string) {
  const session = await requirePermission("inventory.edit");
  const before = await db.productVariant.findUnique({ where: { id: variantId }, select: { barcode: true } });
  await db.productVariant.update({
    where: { id: variantId },
    data: { barcode: null, barcodeType: null, barcodeSource: null, barcodeGeneratedAt: null },
  });
  await logStaffActivity({ actorId: session.user.id, action: "BARCODE_DEACTIVATED", module: "inventory", entityType: "ProductVariant", entityId: variantId, before: { barcode: before?.barcode } });
  revalidateInventoryPaths();
}

export async function logPrint(variantIds: string[]) {
  const session = await requirePermission("inventory.view");
  if (variantIds.length === 0) return;
  await db.barcodePrintLog.create({
    data: { variantIds, labelCount: variantIds.length, userId: session.user.id },
  });
  revalidatePath("/admin/inventory");
}
