"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { mergeValues, type LibValue } from "@/lib/inventory/variant-attributes";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Adds one or more values to the reusable attribute-value library, so they're selectable on
 * future products instead of being retyped. Additive only — never removes anything, and an
 * attribute's `isColor` is fixed at first creation (a later product can't silently flip it).
 */
export async function addAttributeLibraryValues(name: string, isColor: boolean, values: LibValue[]) {
  await requirePermission("products.edit");
  const trimmedName = name.trim();
  if (!trimmedName || values.length === 0) return;

  const existing = await db.attributeValueLibrary.findUnique({ where: { name: trimmedName } });
  const merged = mergeValues((existing?.values as unknown as LibValue[]) ?? [], values);

  await db.attributeValueLibrary.upsert({
    where: { name: trimmedName },
    create: { name: trimmedName, isColor, values: merged as unknown as Prisma.InputJsonValue },
    update: { values: merged as unknown as Prisma.InputJsonValue },
  });
}
