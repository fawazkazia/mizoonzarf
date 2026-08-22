"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function updateCustomerNotes(userId: string, notes: string) {
  await requireSuperAdmin();
  await db.user.update({ where: { id: userId }, data: { notes: notes || null } });
  revalidatePath(`/admin/customers/${userId}`);
}
