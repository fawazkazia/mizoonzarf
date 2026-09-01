import type { TicketPriority, TicketStatus } from "@/generated/prisma/client";

const TERMINAL_STATUSES: TicketStatus[] = ["RESOLVED", "CLOSED"];

/** Hardcoded, not Setting-backed — deliberately simple per spec (basic overdue flag, no
 * admin-configurable SLA console). Hours from ticket creation. */
export const SLA_HOURS: Record<TicketPriority, { firstResponse: number; resolution: number }> = {
  URGENT: { firstResponse: 2, resolution: 24 },
  HIGH: { firstResponse: 4, resolution: 48 },
  NORMAL: { firstResponse: 8, resolution: 72 },
  LOW: { firstResponse: 24, resolution: 120 },
};

export type SlaTicket = {
  createdAt: Date;
  priority: TicketPriority;
  status: TicketStatus;
  firstRespondedAt: Date | null;
};

/** Computed on read, not stored — no cron/materialized column. Overdue on first response
 * while unanswered, OR overdue on resolution while still open. */
export function isTicketOverdue(ticket: SlaTicket, now: Date = new Date()): boolean {
  const hours = SLA_HOURS[ticket.priority];
  const ageMs = now.getTime() - ticket.createdAt.getTime();

  if (!ticket.firstRespondedAt && ageMs > hours.firstResponse * 3_600_000) return true;
  if (!TERMINAL_STATUSES.includes(ticket.status) && ageMs > hours.resolution * 3_600_000) return true;
  return false;
}

export function computeSlaStatus(ticket: SlaTicket, now: Date = new Date()): { overdue: boolean; ageHours: number } {
  return {
    overdue: isTicketOverdue(ticket, now),
    ageHours: Math.round((now.getTime() - ticket.createdAt.getTime()) / 3_600_000),
  };
}
