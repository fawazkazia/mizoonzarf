import type { PrismaClient, Role } from "@/generated/prisma/client";
import { LEGACY_ROLE_PERMISSIONS, LEGACY_ROLE_LABELS } from "./legacy-role-map";

const SYSTEM_ROLES: Role[] = [
  "SUPER_ADMIN",
  "BUSINESS_OWNER",
  "FINANCE",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "MARKETING_MANAGER",
  "CUSTOMER_SUPPORT",
  "CUSTOMER_SUPPORT_MANAGER",
  "INVENTORY_MANAGER",
];

/** Creates/updates the 9 system StaffRole rows mirroring the legacy Role enum, and backfills
 * staffRoleId onto any existing staff account nobody has already assigned a role to. Fully
 * idempotent and touches nothing else — safe to run repeatedly against any environment
 * (including production), unlike the full prisma/seed.ts which also seeds demo catalog data.
 * Used by both prisma/seed.ts (local/dev) and prisma/seed-staff-roles.ts (standalone, prod-safe). */
export async function seedSystemStaffRoles(db: PrismaClient, log: (msg: string) => void = console.log) {
  for (const role of SYSTEM_ROLES) {
    const staffRole = await db.staffRole.upsert({
      where: { name: LEGACY_ROLE_LABELS[role] },
      update: { permissions: LEGACY_ROLE_PERMISSIONS[role], legacyRole: role },
      create: {
        name: LEGACY_ROLE_LABELS[role],
        description: `System role mirroring the legacy "${role}" account type.`,
        permissions: LEGACY_ROLE_PERMISSIONS[role],
        isSystem: true,
        legacyRole: role,
      },
    });
    const result = await db.user.updateMany({ where: { role, staffRoleId: null }, data: { staffRoleId: staffRole.id } });
    log(`${role} -> StaffRole "${staffRole.name}" (${staffRole.id}), backfilled ${result.count} user(s)`);
  }
}
