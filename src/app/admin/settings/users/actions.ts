"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { SETTINGS_ROLES } from "@/lib/admin-permissions";
import type { Role } from "@/generated/prisma/client";

const STAFF_ROLES = [
  "SUPER_ADMIN",
  "BUSINESS_OWNER",
  "FINANCE",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "MARKETING_MANAGER",
  "CUSTOMER_SUPPORT",
  "INVENTORY_MANAGER",
] as const;

const createStaffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(STAFF_ROLES),
});

export async function updateUserRole(userId: string, role: Role) {
  const session = await requireRole(SETTINGS_ROLES);
  if (userId === session.user.id && role === "CUSTOMER") {
    throw new Error("You can't demote your own account.");
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/settings/users");
}

export async function createStaffAccount(raw: z.infer<typeof createStaffSchema>) {
  await requireRole(SETTINGS_ROLES);
  const input = createStaffSchema.parse(raw);

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("An account with this email already exists.");

  const passwordHash = await bcrypt.hash(input.password, 10);
  await db.user.create({ data: { name: input.name, email: input.email, passwordHash, role: input.role } });

  revalidatePath("/admin/settings/users");
}
