"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/auth";

/** Self-service password change for the signed-in staff member — distinct from the forgot-password flow, which is for a signed-out user. Requires the current password, so it never touches role/permissions. */
export async function changeOwnPassword(raw: ChangePasswordInput) {
  const session = await requireStaff();
  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const input = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) throw new Error("Couldn't verify your current password.");

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect.");

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash, passwordChangedAt: new Date() } });
}
