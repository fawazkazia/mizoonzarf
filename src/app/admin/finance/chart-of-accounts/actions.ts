"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { z } from "zod";
import type { AccountType } from "@/generated/prisma/client";

const accountInputSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name is required"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "COGS", "EXPENSE"]),
  isContra: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type LedgerAccountInput = z.infer<typeof accountInputSchema>;

export async function createLedgerAccount(raw: LedgerAccountInput) {
  await requireSuperAdmin();
  const input = accountInputSchema.parse(raw);

  const conflict = await db.ledgerAccount.findUnique({ where: { code: input.code } });
  if (conflict) throw new Error(`Account code "${input.code}" is already in use.`);

  await db.ledgerAccount.create({ data: input });
  revalidatePath("/admin/finance/chart-of-accounts");
}

export async function updateLedgerAccount(id: string, data: { name: string; isActive: boolean }) {
  await requireSuperAdmin();
  await db.ledgerAccount.update({ where: { id }, data: { name: data.name, isActive: data.isActive } });
  revalidatePath("/admin/finance/chart-of-accounts");
}
