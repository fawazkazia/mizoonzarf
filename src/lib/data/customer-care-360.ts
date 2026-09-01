import { db } from "@/lib/db";
import { getCustomerSummary } from "./customer-summary";

export type TimelineEvent = { date: Date; label: string; href?: string };

/**
 * Assembles the full Customer 360 view for a Customer Care ticket: profile, order buckets,
 * refund history, previous tickets (excluding the current one), addresses, and a merged
 * recent-activity timeline. Not exported per-piece — the CustomerCarePanel component takes
 * this whole shape as a prop, so it stays pure/presentational.
 */
export async function getCustomerCare360(customerId: string, excludeTicketId?: string) {
  const summary = await getCustomerSummary(customerId);
  if (!summary) return null;
  const { customer, ...orderBuckets } = summary;

  const [refunds, previousTickets, statusHistory] = await Promise.all([
    db.refund.findMany({
      where: { orderId: { in: customer.orders.map((o) => o.id) } },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true } } },
    }),
    db.ticket.findMany({
      where: { customerId, ...(excludeTicketId ? { id: { not: excludeTicketId } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.orderStatusHistory.findMany({
      where: { orderId: { in: customer.orders.map((o) => o.id) } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { order: { select: { orderNumber: true, id: true } } },
    }),
  ]);

  const timeline: TimelineEvent[] = [
    { date: customer.createdAt, label: "Account created" },
    ...customer.orders.map((o) => ({ date: o.createdAt, label: `Order ${o.orderNumber} placed`, href: `/admin/orders/${o.id}` })),
    ...statusHistory.map((h) => ({
      date: h.createdAt,
      label: `Order ${h.order.orderNumber} → ${h.status.replace(/_/g, " ")}`,
      href: `/admin/orders/${h.order.id}`,
    })),
    ...refunds.map((r) => ({ date: r.createdAt, label: `Refund of ${Number(r.amount)} for order ${r.order.orderNumber}` })),
    ...previousTickets.map((t) => ({ date: t.createdAt, label: `Ticket ${t.ticketNumber} opened — ${t.subject}`, href: `/admin/customer-care/tickets/${t.id}` })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 30);

  return {
    customer,
    ...orderBuckets,
    refunds,
    previousTickets,
    addresses: customer.addresses,
    timeline,
  };
}
