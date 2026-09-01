import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCustomerCareDashboardStats } from "@/lib/data/customer-care-dashboard";
import { CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { StatCard } from "@/components/admin/StatCard";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_PRIORITY_LABEL, TICKET_PRIORITY_TONE } from "@/lib/customer-care/status";
import { CustomerSearchBox } from "./CustomerSearchBox";

export const metadata = { title: "Customer Care" };

export default async function CustomerCareDashboardPage() {
  const [stats, session] = await Promise.all([getCustomerCareDashboardStats(), auth()]);
  const isManager = CUSTOMER_CARE_MANAGER_ROLES.includes(session!.user.role as never);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Customer Care</h1>
          <p className="mt-1 text-sm text-ink-soft">Everything about a customer issue in one place.</p>
        </div>
        <div className="flex gap-3">
          {isManager && (
            <Link
              href="/admin/customer-care/templates"
              className="border border-ink px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-ink hover:bg-paper-dim"
            >
              Reply Templates
            </Link>
          )}
          <Link href="/admin/customer-care/tickets/new" className="border border-ink bg-ink px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-paper hover:bg-ink-soft">
            New Ticket
          </Link>
        </div>
      </div>

      <CustomerSearchBox />

      {stats.urgentOpenCount > 0 && (
        <Link
          href="/admin/customer-care/tickets?priority=URGENT"
          className="block border border-sale bg-sale/10 px-5 py-4 text-sm font-medium text-sale hover:bg-sale/20"
        >
          {stats.urgentOpenCount} urgent ticket{stats.urgentOpenCount === 1 ? "" : "s"} need attention →
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Open" value={String(stats.totalOpen)} href="/admin/customer-care/tickets" />
        <StatCard label="New" value={String(stats.newCount)} href="/admin/customer-care/tickets?status=NEW" />
        <StatCard label="Pending" value={String(stats.pendingCount)} href="/admin/customer-care/tickets?status=WAITING_FOR_CUSTOMER" />
        <StatCard label="In Progress" value={String(stats.inProgressCount)} href="/admin/customer-care/tickets?status=IN_PROGRESS" />
        <StatCard label="Resolved" value={String(stats.resolvedCount)} href="/admin/customer-care/tickets?status=RESOLVED" />
        <StatCard
          label="Escalated"
          value={String(stats.escalatedCount)}
          tone={stats.escalatedCount > 0 ? "warning" : "default"}
          href="/admin/customer-care/tickets?status=ESCALATED"
        />
        <StatCard label="Today's Enquiries" value={String(stats.todayCount)} />
        <StatCard
          label="Unanswered"
          value={String(stats.unansweredCount)}
          tone={stats.unansweredCount > 0 ? "warning" : "default"}
        />
        <StatCard label="Returns Pending" value={String(stats.returnsPendingCount)} href="/admin/returns" />
        <StatCard label="Refunds Pending" value={String(stats.refundsPendingCount)} href="/admin/customer-care/refunds" />
        <StatCard label="Cancellation Requests" value={String(stats.cancellationsCount)} href="/admin/orders?status=CANCELLED" />
        <StatCard
          label="Delivery Issues"
          value={String(stats.deliveryIssueCount)}
          tone={stats.deliveryIssueCount > 0 ? "warning" : "default"}
          href="/admin/customer-care/tickets?category=DELIVERY_ISSUE"
        />
      </div>

      {stats.overdueCount > 0 && (
        <p className="text-sm text-sale">
          {stats.overdueCount} open ticket{stats.overdueCount === 1 ? " is" : "s are"} overdue on SLA.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Recently Updated Tickets</h2>
            <Link href="/admin/customer-care/tickets" className="text-xs uppercase tracking-wide underline">
              View All
            </Link>
          </div>
          <Table compact>
            <thead>
              <tr>
                <Th>Ticket</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTickets.length === 0 && <EmptyRow colSpan={4}>No open tickets.</EmptyRow>}
              {stats.recentTickets.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <Link href={`/admin/customer-care/tickets/${t.id}`} className="hover:underline">
                      {t.ticketNumber}
                    </Link>
                  </Td>
                  <Td>{t.customerName}</Td>
                  <Td>
                    <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={TICKET_PRIORITY_TONE[t.priority]}>{TICKET_PRIORITY_LABEL[t.priority]}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {isManager && (
          <div>
            <h2 className="mb-3 font-display text-lg">Per-Employee Workload</h2>
            <Table compact>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th className="text-right">Open</Th>
                  <Th className="text-right">Pending</Th>
                  <Th className="text-right">Resolved</Th>
                  <Th className="text-right">Escalated</Th>
                </tr>
              </thead>
              <tbody>
                {stats.employeeCounts.length === 0 && <EmptyRow colSpan={5}>No Customer Care staff yet.</EmptyRow>}
                {stats.employeeCounts.map((e) => (
                  <tr key={e.id}>
                    <Td>{e.name}</Td>
                    <Td className="text-right">{e.open}</Td>
                    <Td className="text-right">{e.pending}</Td>
                    <Td className="text-right">{e.resolved}</Td>
                    <Td className="text-right">{e.escalated}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
