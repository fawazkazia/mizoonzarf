import Link from "next/link";
import { formatINR } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "@/lib/customer-care/status";
import type { getCustomerCare360 } from "@/lib/data/customer-care-360";

type Data = NonNullable<Awaited<ReturnType<typeof getCustomerCare360>>>;

/** Full Customer 360° view for a ticket with a real account — profile, order history buckets,
 * refund history, previous tickets, addresses, and a merged activity timeline. */
export function CustomerCarePanel({ data }: { data: Data }) {
  const { customer, totalOrders, totalSpend, currentOrders, previousOrders, cancelledOrders, returnedOrders, refunds, previousTickets, addresses, timeline } = data;

  return (
    <div className="border border-line p-5">
      <h2 className="mb-3 font-display text-lg">Customer 360°</h2>

      <Link href={`/admin/customers/${customer.id}`} className="text-sm font-medium hover:underline">
        {customer.name ?? customer.email}
      </Link>
      <p className="text-xs text-ink-soft">{customer.email}</p>
      <p className="text-xs text-ink-soft">{customer.phone ?? "No phone on file"}</p>
      <p className="mt-1 text-xs text-ink-soft">Joined {customer.createdAt.toLocaleDateString()}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs">
        <div>
          <p className="text-ink-soft">Total Orders</p>
          <p className="font-medium text-ink">{totalOrders}</p>
        </div>
        <div>
          <p className="text-ink-soft">Total Spend</p>
          <p className="font-medium text-ink">{formatINR(totalSpend)}</p>
        </div>
        <div>
          <p className="text-ink-soft">Cancelled</p>
          <p className="font-medium text-ink">{cancelledOrders.length}</p>
        </div>
        <div>
          <p className="text-ink-soft">Returned</p>
          <p className="font-medium text-ink">{returnedOrders.length}</p>
        </div>
      </div>

      <OrderList title="Current Orders" orders={currentOrders} />
      <OrderList title="Previous Orders" orders={previousOrders} />

      {refunds.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">Refund History</p>
          <ul className="flex flex-col gap-1 text-xs">
            {refunds.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span>{r.order.orderNumber}</span>
                <span>
                  {formatINR(Number(r.amount))} — {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {previousTickets.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">Previous Tickets</p>
          <ul className="flex flex-col gap-1.5 text-xs">
            {previousTickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <Link href={`/admin/customer-care/tickets/${t.id}`} className="hover:underline">
                  {t.ticketNumber} — {t.subject}
                </Link>
                <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {addresses.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">Addresses</p>
          <ul className="flex flex-col gap-1 text-xs text-ink-soft">
            {addresses.map((a) => (
              <li key={a.id}>
                {a.fullName} — {a.line1}, {a.city}, {a.country}
              </li>
            ))}
          </ul>
        </div>
      )}

      {timeline.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">Recent Activity</p>
          <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto text-xs">
            {timeline.map((e, i) => (
              <li key={i} className="flex justify-between gap-3">
                {e.href ? (
                  <Link href={e.href} className="hover:underline">
                    {e.label}
                  </Link>
                ) : (
                  <span>{e.label}</span>
                )}
                <span className="shrink-0 text-ink-soft">{e.date.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OrderList({ title, orders }: { title: string; orders: Data["currentOrders"] }) {
  if (orders.length === 0) return null;
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">{title}</p>
      <ul className="flex flex-col gap-1 text-xs">
        {orders.map((o) => (
          <li key={o.id} className="flex justify-between">
            <Link href={`/admin/orders/${o.id}`} className="hover:underline">
              {o.orderNumber}
            </Link>
            <span>{formatINR(Number(o.total))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Guest ticket (contact-form submission, no account) — no Customer 360 exists to show. */
export function GuestContactPanel({ name, email, phone }: { name: string | null; email: string | null; phone: string | null }) {
  return (
    <div className="border border-line p-5">
      <h2 className="mb-3 font-display text-lg">Customer</h2>
      <p className="text-sm font-medium">{name ?? "Guest"}</p>
      <p className="text-xs text-ink-soft">{email ?? "No email"}</p>
      <p className="text-xs text-ink-soft">{phone ?? "No phone"}</p>
      <p className="mt-3 text-xs italic text-ink-soft">No account — guest contact.</p>
    </div>
  );
}
