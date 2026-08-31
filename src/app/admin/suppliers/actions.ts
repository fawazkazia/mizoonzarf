"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { FINANCE_ROLES } from "@/lib/admin-permissions";
import { supplierInputSchema, type SupplierInput } from "@/lib/validation/admin-finance";

function normalize(input: SupplierInput) {
  return {
    name: input.name,
    code: input.code,
    contactName: input.contactName || null,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    gstin: input.gstin || null,
    isActive: input.isActive,
  };
}

export async function createSupplier(raw: SupplierInput) {
  await requireRole(FINANCE_ROLES);
  const input = supplierInputSchema.parse(raw);

  const conflict = await db.supplier.findUnique({ where: { code: input.code } });
  if (conflict) throw new Error(`Supplier code "${input.code}" is already in use.`);

  const supplier = await db.supplier.create({ data: normalize(input) });
  revalidatePath("/admin/suppliers");
  return { id: supplier.id };
}

export async function updateSupplier(id: string, raw: SupplierInput) {
  await requireRole(FINANCE_ROLES);
  const input = supplierInputSchema.parse(raw);

  const conflict = await db.supplier.findFirst({ where: { code: input.code, id: { not: id } } });
  if (conflict) throw new Error(`Supplier code "${input.code}" is already in use.`);

  await db.supplier.update({ where: { id }, data: normalize(input) });
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
  return { id };
}

export async function deleteSupplier(id: string) {
  await requireRole(FINANCE_ROLES);
  const [poCount, expenseCount] = await Promise.all([
    db.purchaseOrder.count({ where: { supplierId: id } }),
    db.expense.count({ where: { supplierId: id } }),
  ]);
  if (poCount > 0 || expenseCount > 0) {
    throw new Error("This supplier has purchase orders or expenses on record and can't be deleted. Mark it inactive instead.");
  }
  await db.supplier.delete({ where: { id } });
  revalidatePath("/admin/suppliers");
}
