"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { ALL_PERMISSION_KEYS, isValidPermissionKey } from "@/lib/permissions/catalog";

const SUPER_ADMIN_ROLE_NAME = "Super Admin";

const roleSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().trim().optional(),
  permissions: z.array(z.string()),
});

function validatePermissionKeys(keys: string[]) {
  for (const key of keys) {
    if (!isValidPermissionKey(key)) throw new Error(`Unknown permission: ${key}`);
  }
}

export async function createStaffRole(raw: z.infer<typeof roleSchema>) {
  const session = await requireSuperAdmin();
  const input = roleSchema.parse(raw);
  validatePermissionKeys(input.permissions);

  const existing = await db.staffRole.findUnique({ where: { name: input.name } });
  if (existing) throw new Error("A role with this name already exists.");

  const role = await db.staffRole.create({
    data: { name: input.name, description: input.description || null, permissions: input.permissions, createdById: session.user.id },
  });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_ROLE_CREATED",
    module: "staff",
    entityType: "StaffRole",
    entityId: role.id,
    after: { name: role.name, permissions: role.permissions },
  });

  revalidatePath("/admin/settings/users/roles");
  return { id: role.id };
}

export async function updateStaffRole(roleId: string, raw: z.infer<typeof roleSchema>) {
  const session = await requireSuperAdmin();
  const input = roleSchema.parse(raw);
  validatePermissionKeys(input.permissions);

  const role = await db.staffRole.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Role not found.");

  // The seeded Super Admin system role must always carry every permission — Super Admin also
  // bypasses permission checks entirely, but keeping this role's own record honest prevents the
  // Roles & Permissions UI from ever showing Super Admin as anything less than full access.
  const isProtectedSuperAdmin = role.isSystem && role.name === SUPER_ADMIN_ROLE_NAME;
  const permissions = isProtectedSuperAdmin ? ALL_PERMISSION_KEYS : input.permissions;
  const name = role.isSystem ? role.name : input.name;

  const updated = await db.staffRole.update({
    where: { id: roleId },
    data: { name, description: input.description || null, permissions },
  });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_ROLE_PERMISSIONS_CHANGED",
    module: "staff",
    entityType: "StaffRole",
    entityId: roleId,
    before: { name: role.name, permissions: role.permissions },
    after: { name: updated.name, permissions: updated.permissions },
  });

  revalidatePath("/admin/settings/users/roles");
  revalidatePath(`/admin/settings/users/roles/${roleId}/edit`);
}

export async function deleteStaffRole(roleId: string) {
  const session = await requireSuperAdmin();

  const role = await db.staffRole.findUnique({ where: { id: roleId }, include: { _count: { select: { users: true } } } });
  if (!role) throw new Error("Role not found.");
  if (role.isSystem) throw new Error("System roles can't be deleted.");
  if (role._count.users > 0) throw new Error(`Reassign the ${role._count.users} staff member(s) using this role before deleting it.`);

  await db.staffRole.delete({ where: { id: roleId } });

  await logStaffActivity({
    actorId: session.user.id,
    action: "STAFF_ROLE_DELETED",
    module: "staff",
    entityType: "StaffRole",
    entityId: roleId,
    before: { name: role.name, permissions: role.permissions },
  });

  revalidatePath("/admin/settings/users/roles");
}
