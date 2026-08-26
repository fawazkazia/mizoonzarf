"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireStaff } from "@/lib/admin-auth";
import { generateBarcodeValue, type BarcodeType } from "@/lib/barcode/generate";
import { validateBarcodeForType } from "@/lib/barcode/validate";
import type { Prisma } from "@/generated/prisma/client";

const INVENTORY_ROLES = ["SUPER_ADMIN", "INVENTORY_MANAGER"] as const;

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
  const session = await requireRole([...INVENTORY_ROLES]);
  const variant = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  if (variant.barcode) throw new Error("This variant already has a barcode. Use Regenerate instead.");

  const barcode = await db.$transaction(async (tx) => {
    const value = await generateBarcodeValue(tx, type);
    await setVariantBarcode(tx, variantId, value, type, "GENERATED", session.user.id);
    return value;
  });

  revalidateInventoryPaths();
  return { barcode };
}

export async function regenerateBarcode(variantId: string, type: BarcodeType = "CODE128") {
  const session = await requireRole([...INVENTORY_ROLES]);
  const variant = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  if (variant.barcodeSource === "MANUFACTURER") {
    throw new Error("This variant carries a manufacturer/GS1 barcode — clear it manually before regenerating.");
  }

  const barcode = await db.$transaction(async (tx) => {
    const value = await generateBarcodeValue(tx, type);
    await setVariantBarcode(tx, variantId, value, type, "GENERATED", session.user.id);
    return value;
  });

  revalidateInventoryPaths();
  return { barcode };
}

export async function bulkGenerateBarcodes(variantIds: string[], type: BarcodeType = "CODE128") {
  const session = await requireRole([...INVENTORY_ROLES]);
  if (variantIds.length === 0) throw new Error("No variants selected.");

  const variants = await db.productVariant.findMany({ where: { id: { in: variantIds } } });
  await db.$transaction(async (tx) => {
    for (const variant of variants) {
      if (variant.barcode) continue;
      const value = await generateBarcodeValue(tx, type);
      await setVariantBarcode(tx, variant.id, value, type, "GENERATED", session.user.id);
    }
  });

  revalidateInventoryPaths();
  return { generated: variants.filter((v) => !v.barcode).length };
}

export async function assignManufacturerBarcode(variantId: string, code: string, type: BarcodeType) {
  const session = await requireRole([...INVENTORY_ROLES]);
  const trimmed = code.trim();
  if (!validateBarcodeForType(trimmed, type)) {
    throw new Error(`"${trimmed}" is not a valid ${type.replace("_", "-")} number (check digit mismatch).`);
  }

  await db.$transaction(async (tx) => {
    await setVariantBarcode(tx, variantId, trimmed, type, "MANUFACTURER", session.user.id);
  });

  revalidateInventoryPaths();
}

export async function deactivateBarcode(variantId: string) {
  await requireRole([...INVENTORY_ROLES]);
  await db.productVariant.update({
    where: { id: variantId },
    data: { barcode: null, barcodeType: null, barcodeSource: null, barcodeGeneratedAt: null },
  });
  revalidateInventoryPaths();
}

export async function logPrint(variantIds: string[]) {
  const session = await requireStaff();
  if (variantIds.length === 0) return;
  await db.barcodePrintLog.create({
    data: { variantIds, labelCount: variantIds.length, userId: session.user.id },
  });
  revalidatePath("/admin/inventory");
}
