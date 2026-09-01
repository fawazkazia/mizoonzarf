import { db } from "@/lib/db";
import { isTicketOverdue } from "@/lib/customer-care/sla";
import type { TicketStatus } from "@/generated/prisma/client";

const OPEN_STATUSES: TicketStatus[] = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "ESCALATED"];

export async function getCustomerCareDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [statusGroups, urgentOpenCount, todayCount, returnsPendingCount, refundsPendingCount, cancellationsCount, deliveryIssueCount, openTicketsForSla, recentTickets, employeeGroups, staff] =
    await Promise.all([
      db.ticket.groupBy({ by: ["status"], _count: true }),
      db.ticket.count({ where: { priority: "URGENT", status: { in: OPEN_STATUSES } } }),
      db.ticket.count({ where: { createdAt: { gte: startOfToday } } }),
      db.return.count({ where: { status: { in: ["REQUESTED", "APPROVED", "PICKUP", "RECEIVED", "REFUND_PROCESSING"] } } }),
      db.refund.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: "CANCELLED" } }),
      db.ticket.count({ where: { category: { in: ["DELIVERY_ISSUE", "DELAYED_DELIVERY"] }, status: { in: OPEN_STATUSES } } }),
      db.ticket.findMany({
        where: { status: { in: OPEN_STATUSES } },
        select: { id: true, createdAt: true, priority: true, status: true, firstRespondedAt: true },
      }),
      db.ticket.findMany({
        where: { status: { in: OPEN_STATUSES } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          category: true,
          status: true,
          priority: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
          guestName: true,
          guestEmail: true,
          assignedTo: { select: { name: true, email: true } },
        },
      }),
      db.ticket.groupBy({ by: ["assignedToId", "status"], _count: true }),
      db.user.findMany({ where: { role: { in: ["CUSTOMER_SUPPORT", "CUSTOMER_SUPPORT_MANAGER"] } }, select: { id: true, name: true, email: true } }),
    ]);

  const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count])) as Record<TicketStatus, number>;
  const totalOpen = OPEN_STATUSES.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0);
  const overdueCount = openTicketsForSla.filter((t) => isTicketOverdue(t)).length;
  const unansweredCount = await db.ticket.count({
    where: { status: { in: OPEN_STATUSES }, messages: { none: { authorType: "EMPLOYEE", isInternal: false } } },
  });

  const employeeCounts = staff.map((s) => {
    const rows = employeeGroups.filter((g) => g.assignedToId === s.id);
    const byStatus = Object.fromEntries(rows.map((r) => [r.status, r._count])) as Record<TicketStatus, number>;
    const open = OPEN_STATUSES.reduce((sum, st) => sum + (byStatus[st] ?? 0), 0);
    return {
      id: s.id,
      name: s.name ?? s.email,
      open,
      pending: (byStatus.NEW ?? 0) + (byStatus.WAITING_FOR_CUSTOMER ?? 0),
      resolved: byStatus.RESOLVED ?? 0,
      escalated: byStatus.ESCALATED ?? 0,
    };
  });

  return {
    totalOpen,
    newCount: statusCounts.NEW ?? 0,
    pendingCount: (statusCounts.NEW ?? 0) + (statusCounts.WAITING_FOR_CUSTOMER ?? 0),
    inProgressCount: statusCounts.IN_PROGRESS ?? 0,
    resolvedCount: statusCounts.RESOLVED ?? 0,
    escalatedCount: statusCounts.ESCALATED ?? 0,
    todayCount,
    unansweredCount,
    returnsPendingCount,
    refundsPendingCount,
    cancellationsCount,
    deliveryIssueCount,
    urgentOpenCount,
    overdueCount,
    recentTickets: recentTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      category: t.category,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      customerName: t.customer?.name ?? t.customer?.email ?? t.guestName ?? t.guestEmail ?? "Guest",
      assignedTo: t.assignedTo?.name ?? t.assignedTo?.email ?? null,
    })),
    employeeCounts,
  };
}
