"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff, requireSuperAdmin } from "@/lib/admin-auth";
import type { ReliabilityStatus } from "@/generated/prisma/client";

export async function updateCustomerNotes(userId: string, notes: string) {
  await requireSuperAdmin();
  await db.user.update({ where: { id: userId }, data: { notes: notes || null } });
  revalidatePath(`/admin/customers/${userId}`);
}

export async function updateReliabilityOverride(userId: string, override: ReliabilityStatus | null, note: string) {
  const session = await requireStaff();
  await db.user.update({
    where: { id: userId },
    data: {
      reliabilityOverride: override,
      reliabilityOverrideNote: note || null,
      reliabilityOverrideBy: override ? session.user.id : null,
      reliabilityOverrideAt: override ? new Date() : null,
    },
  });
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}
