import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

/** Throws if this mutation would remove Super Admin access from the last active Super Admin
 * account — the spec's "never allow another role to remove or modify Super Admin access"
 * requirement, enforced as a lockout guard rather than a permission check (Super Admin already
 * bypasses every permission check, so the risk here is deletion/role-change/suspension, not a
 * missing grant). Call with the account's *current* role before applying the change. */
export async function assertNotLastSuperAdmin(targetUserId: string, currentRole: Role): Promise<void> {
  if (currentRole !== "SUPER_ADMIN") return;
  const otherActiveSuperAdmins = await db.user.count({
    where: { id: { not: targetUserId }, role: "SUPER_ADMIN", status: "ACTIVE" },
  });
  if (otherActiveSuperAdmins === 0) {
    throw new Error("Can't remove or suspend the last remaining Super Admin account.");
  }
}
