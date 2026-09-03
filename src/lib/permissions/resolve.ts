import type { Role } from "@/generated/prisma/client";
import { LEGACY_ROLE_PERMISSIONS } from "./legacy-role-map";

export type PermissionSource = {
  role: Role;
  staffRolePermissions: string[] | null | undefined;
  permissionOverrides: string[];
  permissionRevocations: string[];
};

/** Effective permission set for a user: their assigned StaffRole's permissions (falling back to
 * the legacy Role enum's default set if no StaffRole is assigned yet), plus per-user overrides,
 * minus per-user revocations. Super Admin is handled separately as an always-allow bypass — see
 * hasPermission()/requirePermission() — so it is not special-cased here. */
export function computeEffectivePermissions(source: PermissionSource): string[] {
  const base = source.staffRolePermissions ?? LEGACY_ROLE_PERMISSIONS[source.role] ?? [];
  const withOverrides = new Set(base);
  for (const key of source.permissionOverrides) withOverrides.add(key);
  for (const key of source.permissionRevocations) withOverrides.delete(key);
  return Array.from(withOverrides);
}

export type PermissionSession = {
  user: { role: string; permissions?: string[] };
};

/** Non-throwing permission check for UI conditionals. Super Admin always passes. */
export function hasPermission(session: PermissionSession | null | undefined, key: string): boolean {
  if (!session?.user) return false;
  if (session.user.role === "SUPER_ADMIN") return true;
  return (session.user.permissions ?? []).includes(key);
}
