import { db } from "@/lib/db";
import { getCustomerSummary } from "./customer-summary";

export type CustomerStatus = "New" | "Active" | "Dormant";

/**
 * Full Customer Care profile data — the single query set behind the redesigned
 * /admin/customers/[id] page. Builds on getCustomerSummary (shared with the Ticket-detail
 * Customer 360 panel) and adds everything specific to the full-page profile: actual Return
 * rows (not just RETURNED-status orders), refund history, this customer's support tickets,
 * a merged activity timeline, and a derived (never stored) customer status.
 */
export async function getCustomerProfile(customerId: string) {
  const summary = await getCustomerSummary(customerId);
  if (!summary) return null;
  const { customer, totalOrders, totalSpend, currentOrders, previousOrders, cancelledOrders, returnedOrders } = summary;
  const orderIds = customer.orders.map((o) => o.id);

  const [returns, refunds, tickets, statusHistory, wishlistItems] = await Promise.all([
    db.return.findMany({
      where: { orderId: { in: orderIds } },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { id: true, orderNumber: true } }, orderItem: { select: { productName: true } } },
    }),
    db.refund.findMany({
      where: { orderId: { in: orderIds } },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { id: true, orderNumber: true } } },
    }),
    db.ticket.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: { assignedTo: { select: { name: true, email: true } } },
    }),
    db.orderStatusHistory.findMany({
      where: { orderId: { in: orderIds } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { order: { select: { id: true, orderNumber: true } } },
    }),
    db.wishlistItem.findMany({ where: { userId: customerId }, include: { product: { select: { name: true, slug: true } } } }),
  ]);

  const lastOrder = customer.orders[0] ?? null;
  const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

  const timeline = [
    { date: customer.createdAt, label: "Account registered", href: undefined as string | undefined },
    ...customer.orders.map((o) => ({ date: o.createdAt, label: `Order ${o.orderNumber} placed`, href: `/admin/orders/${o.id}` })),
    ...statusHistory.map((h) => ({ date: h.createdAt, label: `Order ${h.order.orderNumber} → ${h.status.replace(/_/g, " ")}`, href: `/admin/orders/${h.order.id}` })),
    ...returns.map((r) => ({ date: r.createdAt, label: `Return requested — ${r.order.orderNumber} (${r.reason})`, href: `/admin/returns/${r.id}` })),
    ...refunds.map((r) => ({ date: r.createdAt, label: `Refund of ${Number(r.amount)} — ${r.order.orderNumber}`, href: `/admin/orders/${r.order.id}` })),
    ...tickets.map((t) => ({ date: t.createdAt, label: `Support query opened — ${t.subject}`, href: `/admin/customer-care/tickets/${t.id}` })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 40);

  // Derived on read, never stored — "New" with no orders, "Active" with an order in the last 90
  // days, else "Dormant". Purely a display label; nothing else depends on it.
  const daysSinceLastOrder = lastOrder ? (Date.now() - lastOrder.createdAt.getTime()) / 86_400_000 : null;
  const status: CustomerStatus = totalOrders === 0 ? "New" : daysSinceLastOrder !== null && daysSinceLastOrder <= 90 ? "Active" : "Dormant";

  return {
    customer,
    totalOrders,
    totalSpend,
    avgOrderValue,
    lastOrder,
    currentOrders,
    previousOrders,
    cancelledOrders,
    returnedOrders,
    returns,
    refunds,
    tickets,
    wishlistItems,
    timeline,
    status,
  };
}
