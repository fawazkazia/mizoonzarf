import { auth } from "@/lib/auth";

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
