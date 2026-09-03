import { auth } from "@/lib/auth";
import type { AdminSession } from "@/lib/admin-auth";
import { hasPermission } from "./resolve";
import { permissionLabel } from "./catalog";

/** Granular Server Action gate — analogous to requireRole() in src/lib/admin-auth.ts, but checks
 * a single permission key instead of role membership. Super Admin always passes (see
 * hasPermission()) and can never be locked out of anything by a role/permission change. Throws,
 * so backend enforcement holds even if a restricted staff member reaches the action directly
 * (devtools, a hand-crafted request) rather than through the UI. */
export async function requirePermission(key: string): Promise<AdminSession> {
  const session = await auth();
  if (!session?.user || session.user.role === "CUSTOMER") {
    throw new Error("Not authorized.");
  }
  if (!hasPermission({ user: session.user as { role: string; permissions?: string[] } }, key)) {
    throw new Error(`You don't have permission to ${permissionLabel(key).toLowerCase()}.`);
  }
  return session as AdminSession;
}
