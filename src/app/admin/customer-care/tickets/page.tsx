import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { Badge } from "@/components/ui/Badge";
import {
  ALL_TICKET_STATUSES,
  ALL_TICKET_PRIORITIES,
  ALL_TICKET_CATEGORIES,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
  TICKET_PRIORITY_LABEL,
  TICKET_PRIORITY_TONE,
} from "@/lib/customer-care/status";
import { isTicketOverdue } from "@/lib/customer-care/sla";
import { CUSTOMER_CARE_ROLES } from "@/lib/admin-permissions";
import { AssigneeFilterSelect } from "./AssigneeFilterSelect";

export const metadata = { title: "Tickets" };

const PER_PAGE = 20;

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; category?: string; priority?: string; assignee?: string; page?: string }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const session = await auth();
  const myId = session!.user.id;
  const effectiveAssignee = sp.assignee === "me" ? myId : sp.assignee;

  const where: Prisma.TicketWhereInput = {};
  if (sp.q) {
    where.OR = [
      { ticketNumber: { contains: sp.q, mode: "insensitive" } },
      { guestName: { contains: sp.q, mode: "insensitive" } },
      { guestEmail: { contains: sp.q, mode: "insensitive" } },
      { guestPhone: { contains: sp.q, mode: "insensitive" } },
      { customer: { name: { contains: sp.q, mode: "insensitive" } } },
      { customer: { email: { contains: sp.q, mode: "insensitive" } } },
      { customer: { phone: { contains: sp.q, mode: "insensitive" } } },
      { order: { orderNumber: { contains: sp.q, mode: "insensitive" } } },
      { order: { shipment: { trackingNumber: { contains: sp.q, mode: "insensitive" } } } },
    ];
  }
  if (sp.status) where.status = sp.status as never;
  if (sp.category) where.category = sp.category as never;
  if (sp.priority) where.priority = sp.priority as never;
  if (effectiveAssignee) where.assignedToId = effectiveAssignee;

  const [tickets, total, staff] = await Promise.all([
    db.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        customer: { select: { name: true, email: true } },
        order: { select: { orderNumber: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    }),
    db.ticket.count({ where }),
    db.user.findMany({ where: { role: { in: CUSTOMER_CARE_ROLES } }, select: { id: true, name: true, email: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Tickets</h1>
        <Link href="/admin/customer-care/tickets/new" className="border border-ink bg-ink px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-paper hover:bg-ink-soft">
          New Ticket
        </Link>
      </div>

      <QuickFilters sp={sp} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search ticket #, customer, order #, tracking #..." />
        <StatusFilterSelect options={ALL_TICKET_STATUSES} />
        <StatusFilterSelect options={ALL_TICKET_CATEGORIES} paramKey="category" placeholder="All Categories" />
        <StatusFilterSelect options={ALL_TICKET_PRIORITIES} paramKey="priority" placeholder="All Priorities" />
        <AssigneeFilterSelect staff={staff} />
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Ticket</Th>
            <Th>Customer</Th>
            <Th>Category</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Assigned</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 && <EmptyRow colSpan={7}>No tickets found.</EmptyRow>}
          {tickets.map((t) => {
            const overdue = isTicketOverdue(t);
            return (
              <tr key={t.id}>
                <Td>
                  <Link href={`/admin/customer-care/tickets/${t.id}`} className="font-medium hover:underline">
                    {t.ticketNumber}
                  </Link>
                  {overdue && (
                    <span className="ml-2">
                      <Badge tone="sale">Overdue</Badge>
                    </span>
                  )}
                </Td>
                <Td>{t.customer?.name ?? t.customer?.email ?? t.guestName ?? t.guestEmail ?? "Guest"}</Td>
                <Td>{t.category.replace(/_/g, " ")}</Td>
                <Td>
                  <Badge tone={TICKET_PRIORITY_TONE[t.priority]}>{TICKET_PRIORITY_LABEL[t.priority]}</Badge>
                </Td>
                <Td>
                  <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Badge>
                </Td>
                <Td>{t.assignedTo?.name ?? t.assignedTo?.email ?? "Unassigned"}</Td>
                <Td>{t.createdAt.toLocaleDateString()}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.max(Math.ceil(total / PER_PAGE), 1)}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.q) params.set("q", sp.q);
          if (sp.status) params.set("status", sp.status);
          if (sp.category) params.set("category", sp.category);
          if (sp.priority) params.set("priority", sp.priority);
          if (sp.assignee) params.set("assignee", sp.assignee);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}

/** One-click shortcuts for the views a Customer Care employee reaches for most — the sidebar
 * equivalent of "All Queries / Open / In Progress / Waiting for Customer / Resolved / High
 * Priority / My Assigned Queries" now lives here instead of as separate global-nav entries. */
function QuickFilters({ sp }: { sp: { status?: string; priority?: string; assignee?: string } }) {
  const shortcuts: { label: string; href: string; active: boolean }[] = [
    { label: "All", href: "/admin/customer-care/tickets", active: !sp.status && !sp.priority && sp.assignee !== "me" },
    { label: "Open", href: "/admin/customer-care/tickets?status=OPEN", active: sp.status === "OPEN" },
    { label: "In Progress", href: "/admin/customer-care/tickets?status=IN_PROGRESS", active: sp.status === "IN_PROGRESS" },
    { label: "Waiting for Customer", href: "/admin/customer-care/tickets?status=WAITING_FOR_CUSTOMER", active: sp.status === "WAITING_FOR_CUSTOMER" },
    { label: "Resolved", href: "/admin/customer-care/tickets?status=RESOLVED", active: sp.status === "RESOLVED" },
    { label: "High Priority", href: "/admin/customer-care/tickets?priority=HIGH", active: sp.priority === "HIGH" },
    { label: "My Assigned Queries", href: "/admin/customer-care/tickets?assignee=me", active: sp.assignee === "me" },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {shortcuts.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className={cn(
            "border px-3 py-1.5 text-xs uppercase tracking-wide",
            s.active ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink"
          )}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
