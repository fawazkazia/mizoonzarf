import { db } from "@/lib/db";

const FAILED_LOGIN_THRESHOLD = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** Staff accounts with 5+ failed login attempts in the last 15 minutes — a simple, query-time
 * brute-force heuristic (no background job, no new table) surfaced as a "Suspicious" flag in the
 * Staff & Roles dashboard and each account's Login & Security History. */
export async function getSuspiciousLoginUserIds(): Promise<Set<string>> {
  const since = new Date(Date.now() - WINDOW_MS);
  const rows = await db.loginHistory.groupBy({
    by: ["userId"],
    where: { event: "LOGIN_FAILED", createdAt: { gte: since } },
    _count: { id: true },
    having: { id: { _count: { gte: FAILED_LOGIN_THRESHOLD } } },
  });
  return new Set(rows.map((r) => r.userId));
}
