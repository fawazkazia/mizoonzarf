import { db } from "@/lib/db";

/** Sequential "EMP-000123" style ID for a new staff account. Retries on the rare unique-
 * constraint race (two admins creating staff at the same instant) instead of failing outright. */
export async function generateEmployeeId(): Promise<string> {
  const count = await db.user.count({ where: { employeeId: { not: null } } });
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `EMP-${String(count + 1 + attempt).padStart(6, "0")}`;
    const clash = await db.user.findUnique({ where: { employeeId: candidate }, select: { id: true } });
    if (!clash) return candidate;
  }
  throw new Error("Could not allocate a unique employee ID — please retry.");
}
