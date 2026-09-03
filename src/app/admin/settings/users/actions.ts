"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { legacyRoleForStaffRole } from "@/lib/permissions/assign-role";
import { assertNotLastSuperAdmin } from "@/lib/permissions/guard-last-super-admin";
import { generateEmployeeId } from "@/lib/permissions/employee-id";
import { isValidPermissionKey } from "@/lib/permissions/catalog";

const createStaffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  staffRoleId: z.string().min(1, "Role is required"),
  department: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  image: z.string().optional(),
});

export async function createStaffAccount(raw: z.infer<typeof createStaffSchema>) {
  const session = await requireSuperAdmin();
  const input = createStaffSchema.parse(raw);

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("An account with this email already exists.");

  const staffRole = await db.staffRole.findUnique({ where: { id: input.staffRoleId } });
  if (!staffRole) throw new Error("That role no longer exists.");

  const [passwordHash, employeeId] = await Promise.all([bcrypt.hash(input.password, 10), generateEmployeeId()]);

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: legacyRoleForStaffRole(staffRole),
      staffRoleId: staffRole.id,
      department: input.department || null,
      jobTitle: input.jobTitle || null,
      phone: input.phone || null,
      image: input.image || null,
      employeeId,
      createdById: session.user.id,
    },
  });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_CREATED",
    module: "staff",
    entityType: "User",
    entityId: user.id,
    after: { name: user.name, email: user.email, role: staffRole.name, employeeId },
  });

  revalidatePath("/admin/settings/users");
}

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().trim().optional(),
  department: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  image: z.string().nullable().optional(),
});

export async function updateStaffProfile(userId: string, raw: z.infer<typeof updateProfileSchema>) {
  const session = await requireSuperAdmin();
  const input = updateProfileSchema.parse(raw);

  const before = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, department: true, jobTitle: true, image: true },
  });
  if (!before) throw new Error("Staff member not found.");

  const after = await db.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone ?? undefined,
      department: input.department ?? undefined,
      jobTitle: input.jobTitle ?? undefined,
      image: input.image === undefined ? undefined : input.image,
    },
    select: { name: true, phone: true, department: true, jobTitle: true, image: true },
  });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_PROFILE_EDITED",
    module: "staff",
    entityType: "User",
    entityId: userId,
    before,
    after,
  });

  revalidatePath(`/admin/settings/users/${userId}`);
  revalidatePath("/admin/settings/users");
}

export async function assignStaffRole(userId: string, staffRoleId: string) {
  const session = await requireSuperAdmin();

  const [target, staffRole] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, include: { staffRole: true } }),
    db.staffRole.findUnique({ where: { id: staffRoleId } }),
  ]);
  if (!target) throw new Error("Staff member not found.");
  if (!staffRole) throw new Error("That role no longer exists.");

  await assertNotLastSuperAdmin(userId, target.role);

  await db.user.update({
    where: { id: userId },
    data: { staffRoleId: staffRole.id, role: legacyRoleForStaffRole(staffRole) },
  });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_ROLE_CHANGED",
    module: "staff",
    entityType: "User",
    entityId: userId,
    before: { role: target.staffRole?.name ?? target.role },
    after: { role: staffRole.name },
  });

  revalidatePath("/admin/settings/users");
  revalidatePath(`/admin/settings/users/${userId}`);
}

const overridesSchema = z.object({
  permissionOverrides: z.array(z.string()),
  permissionRevocations: z.array(z.string()),
});

/** Per-staff permission override layered on top of their role (spec: "custom permission
 * override when required") — e.g. grant one Customer Support agent `orders.refund` without
 * creating a whole new role, or revoke one permission their role would otherwise grant. */
export async function updateStaffPermissionOverrides(userId: string, raw: z.infer<typeof overridesSchema>) {
  const session = await requireSuperAdmin();
  const input = overridesSchema.parse(raw);

  for (const key of [...input.permissionOverrides, ...input.permissionRevocations]) {
    if (!isValidPermissionKey(key)) throw new Error(`Unknown permission: ${key}`);
  }

  const before = await db.user.findUnique({
    where: { id: userId },
    select: { permissionOverrides: true, permissionRevocations: true },
  });
  if (!before) throw new Error("Staff member not found.");

  await db.user.update({
    where: { id: userId },
    data: { permissionOverrides: input.permissionOverrides, permissionRevocations: input.permissionRevocations },
  });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_PERMISSIONS_OVERRIDDEN",
    module: "staff",
    entityType: "User",
    entityId: userId,
    before,
    after: input,
  });

  revalidatePath(`/admin/settings/users/${userId}`);
}

export async function suspendStaff(userId: string) {
  const session = await requireSuperAdmin();
  if (userId === session.user.id) throw new Error("You can't suspend your own account.");

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Staff member not found.");
  await assertNotLastSuperAdmin(userId, target.role);

  await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED", suspendedAt: new Date() } });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_SUSPENDED",
    module: "staff",
    entityType: "User",
    entityId: userId,
    before: { status: target.status },
    after: { status: "SUSPENDED" },
  });

  revalidatePath("/admin/settings/users");
  revalidatePath(`/admin/settings/users/${userId}`);
}

export async function deactivateStaff(userId: string) {
  const session = await requireSuperAdmin();
  if (userId === session.user.id) throw new Error("You can't deactivate your own account.");

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Staff member not found.");
  await assertNotLastSuperAdmin(userId, target.role);

  await db.user.update({ where: { id: userId }, data: { status: "DEACTIVATED", suspendedAt: new Date() } });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_DEACTIVATED",
    module: "staff",
    entityType: "User",
    entityId: userId,
    before: { status: target.status },
    after: { status: "DEACTIVATED" },
  });

  revalidatePath("/admin/settings/users");
  revalidatePath(`/admin/settings/users/${userId}`);
}

export async function activateStaff(userId: string) {
  const session = await requireSuperAdmin();

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Staff member not found.");

  await db.user.update({ where: { id: userId }, data: { status: "ACTIVE", suspendedAt: null } });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_ACTIVATED",
    module: "staff",
    entityType: "User",
    entityId: userId,
    before: { status: target.status },
    after: { status: "ACTIVE" },
  });

  revalidatePath("/admin/settings/users");
  revalidatePath(`/admin/settings/users/${userId}`);
}

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

/** Generates and sets a new temporary password, shown once in the admin UI — bumping
 * passwordChangedAt also invalidates the account's existing session (see jwt() in auth.ts). */
export async function resetStaffPassword(userId: string): Promise<{ tempPassword: string }> {
  const session = await requireSuperAdmin();

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) throw new Error("Staff member not found.");

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await db.user.update({ where: { id: userId }, data: { passwordHash, passwordChangedAt: new Date() } });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_PASSWORD_RESET",
    module: "staff",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath(`/admin/settings/users/${userId}`);
  return { tempPassword };
}
