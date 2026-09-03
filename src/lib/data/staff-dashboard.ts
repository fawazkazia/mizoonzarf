import { db } from "@/lib/db";
import { getSuspiciousLoginUserIds } from "@/lib/permissions/suspicious-activity";

/** "Online now" — a staff request touched lastActiveAt within this window. No websocket/presence
 * system; lastActiveAt is now touched on every authenticated request (throttled to once a
 * minute), not just at login, so this reflects active browsing, not just "logged in earlier". */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export async function getStaffDashboardStats() {
  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalStaff,
    activeStaff,
    inactiveStaff,
    suspendedStaff,
    totalRoles,
    onlineStaff,
    recentActivity,
    recentSecurityEvents,
    mostActiveGroups,
    recentlyCreated,
    recentlyModifiedRoles,
    suspiciousUserIds,
  ] = await Promise.all([
    db.user.count({ where: { role: { not: "CUSTOMER" } } }),
    db.user.count({ where: { role: { not: "CUSTOMER" }, status: "ACTIVE" } }),
    db.user.count({ where: { role: { not: "CUSTOMER" }, status: "DEACTIVATED" } }),
    db.user.count({ where: { role: { not: "CUSTOMER" }, status: "SUSPENDED" } }),
    db.staffRole.count(),
    db.user.findMany({
      where: { role: { not: "CUSTOMER" }, lastActiveAt: { gte: onlineSince } },
      orderBy: { lastActiveAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
    db.staffActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true, email: true } } },
    }),
    db.loginHistory.findMany({
      where: { event: { in: ["LOGIN_FAILED", "LOGIN_SUCCESS"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.staffActivityLog.groupBy({ by: ["actorId"], where: { createdAt: { gte: since30d } }, _count: true, orderBy: { _count: { actorId: "desc" } }, take: 5 }),
    db.user.findMany({
      where: { role: { not: "CUSTOMER" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    db.staffRole.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, name: true, updatedAt: true } }),
    getSuspiciousLoginUserIds(),
  ]);

  const actorIds = mostActiveGroups.map((g) => g.actorId);
  const actors = actorIds.length
    ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
    : [];
  const mostActive = mostActiveGroups.map((g) => {
    const actor = actors.find((a) => a.id === g.actorId);
    return { id: g.actorId, name: actor?.name ?? actor?.email ?? "Unknown", count: g._count };
  });

  return {
    totalStaff,
    activeStaff,
    inactiveStaff,
    suspendedStaff,
    totalRoles,
    onlineNow: onlineStaff.length,
    onlineStaff: onlineStaff.map((u) => ({ id: u.id, name: u.name ?? u.email })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      actorName: a.actor.name ?? a.actor.email,
      action: a.action,
      module: a.module,
      entityId: a.entityId,
      createdAt: a.createdAt,
    })),
    recentSecurityEvents: recentSecurityEvents.map((e) => ({
      id: e.id,
      userName: e.user.name ?? e.user.email,
      event: e.event,
      ipAddress: e.ipAddress,
      createdAt: e.createdAt,
      suspicious: suspiciousUserIds.has(e.userId),
    })),
    mostActive,
    recentlyCreated,
    recentlyModifiedRoles,
  };
}
