import { db } from "@/lib/db";
import type { AnalyticsRange } from "./date-presets";

const DELIVERY_CATEGORIES = ["DELIVERY_ISSUE", "DELAYED_DELIVERY"] as const;

export async function getCustomerCareReport(range: AnalyticsRange) {
  const where = { createdAt: { gte: range.from, lte: range.to } };

  const [total, byCategory, byEmployeeRaw, open, resolved, escalated, cancellationCount, returnCount, refundCount, deliveryCount, complaintCount, timings, staff] =
    await Promise.all([
      db.ticket.count({ where }),
      db.ticket.groupBy({ by: ["category"], where, _count: true }),
      db.ticket.groupBy({ by: ["assignedToId"], where, _count: true }),
      db.ticket.count({ where: { ...where, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.ticket.count({ where: { ...where, status: "RESOLVED" } }),
      db.ticket.count({ where: { ...where, status: "ESCALATED" } }),
      db.ticket.count({ where: { ...where, category: "ORDER_CANCELLATION" } }),
      db.ticket.count({ where: { ...where, category: "RETURN_REQUEST" } }),
      db.ticket.count({ where: { ...where, category: "REFUND_ISSUE" } }),
      db.ticket.count({ where: { ...where, category: { in: [...DELIVERY_CATEGORIES] } } }),
      db.ticket.count({ where: { ...where, category: "COMPLAINT" } }),
      db.ticket.findMany({ where, select: { createdAt: true, firstRespondedAt: true, resolvedAt: true } }),
      db.user.findMany({ where: { role: { in: ["CUSTOMER_SUPPORT", "CUSTOMER_SUPPORT_MANAGER"] } }, select: { id: true, name: true, email: true } }),
    ]);

  const respondedTimings = timings.filter((t) => t.firstRespondedAt);
  const avgFirstResponseHours =
    respondedTimings.length > 0
      ? respondedTimings.reduce((sum, t) => sum + (t.firstRespondedAt!.getTime() - t.createdAt.getTime()), 0) / respondedTimings.length / 3_600_000
      : 0;
  const resolvedTimings = timings.filter((t) => t.resolvedAt);
  const avgResolutionHours =
    resolvedTimings.length > 0
      ? resolvedTimings.reduce((sum, t) => sum + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolvedTimings.length / 3_600_000
      : 0;

  const byEmployee = staff.map((s) => ({
    name: s.name ?? s.email,
    count: byEmployeeRaw.find((g) => g.assignedToId === s.id)?._count ?? 0,
  }));
  const unassignedCount = byEmployeeRaw.find((g) => g.assignedToId === null)?._count ?? 0;

  return {
    total,
    open,
    resolved,
    escalated,
    cancellationCount,
    returnCount,
    refundCount,
    deliveryCount,
    complaintCount,
    avgFirstResponseHours: Math.round(avgFirstResponseHours * 10) / 10,
    avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
    byCategory: byCategory.map((g) => ({ category: g.category, count: g._count })).sort((a, b) => b.count - a.count),
    byEmployee: [...byEmployee, ...(unassignedCount > 0 ? [{ name: "Unassigned", count: unassignedCount }] : [])].sort((a, b) => b.count - a.count),
  };
}
