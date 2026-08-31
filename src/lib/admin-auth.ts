import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/client";

export type AdminSession = { user: { id: string; name?: string | null; email?: string | null; role: string } };

/** Throws if the caller isn't signed in as staff — use at the top of every admin Server Action. */
export async function requireStaff(): Promise<AdminSession> {
  const session = await auth();
  if (!session?.user || session.user.role === "CUSTOMER") {
    throw new Error("Not authorized.");
  }
  return session as AdminSession;
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireStaff();
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("This action requires a Super Admin account.");
  }
  return session;
}

/** Throws unless the signed-in staff member's role is one of `roles` — use for permission-gated mutations. */
export async function requireRole(roles: Role[]): Promise<AdminSession> {
  const session = await requireStaff();
  if (!roles.includes(session.user.role as Role)) {
    throw new Error("You don't have permission to perform this action.");
  }
  return session;
}

/**
 * Page-level (non-throwing) access check for use in section layout.tsx files — returns the
 * session when access is allowed, or null when it should render the shared <AccessDenied />.
 * Distinct from requireRole() above, which throws and is for Server Actions.
 */
export async function getSectionAccess(roles: Role[]): Promise<AdminSession | null> {
  const session = await auth();
  if (!session?.user || session.user.role === "CUSTOMER") return null;
  if (!roles.includes(session.user.role as Role)) return null;
  return session as AdminSession;
}
