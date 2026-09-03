import type { Role } from "@/generated/prisma/client";
import { NEUTRAL_LEGACY_ROLE_SHELL } from "./legacy-role-map";

/** The legacy `Role` enum value a user should carry once assigned a given StaffRole — keeps
 * User.role (still authoritative for admin sections not yet migrated to requirePermission())
 * in sync with the new granular system. System roles round-trip to the exact enum value they
 * mirror; a brand-new custom role falls back to the neutral shell. */
export function legacyRoleForStaffRole(staffRole: { isSystem: boolean; legacyRole: Role | null }): Role {
  if (staffRole.isSystem && staffRole.legacyRole) return staffRole.legacyRole;
  return NEUTRAL_LEGACY_ROLE_SHELL;
}
