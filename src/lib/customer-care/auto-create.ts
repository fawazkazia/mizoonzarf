import { db } from "@/lib/db";
import { generateTicketNumber } from "./ticket-number";
import { sendTicketEmail } from "@/lib/notifications/ticket-email";
import type { TicketCategory } from "@/generated/prisma/client";

export type TicketSource = "MANUAL" | "CONTACT_FORM" | "ORDER_CANCELLATION" | "RETURN_REQUEST" | "REFUND";

/**
 * Creates a Ticket + its first (customer) TicketMessage for a system-triggered event
 * (return request, order cancellation, standalone refund, contact form). Never throws — the
 * calling business operation (which already committed) must never fail because ticket
 * creation failed. Failures are logged to console + AuditLog, matching the existing
 * REFUND_FAILED/JOURNAL_POST_FAILED idiom used elsewhere in this codebase.
 */
export async function createTicketFromSystemEvent(params: {
  category: TicketCategory;
  source: TicketSource;
  orderId?: string;
  customerId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  subject: string;
  description: string;
}): Promise<{ id: string; ticketNumber: string } | null> {
  try {
    const ticket = await db.$transaction(async (tx) => {
      const ticketNumber = await generateTicketNumber(tx);
      const created = await tx.ticket.create({
        data: {
          ticketNumber,
          category: params.category,
          source: params.source,
          orderId: params.orderId,
          customerId: params.customerId ?? null,
          guestName: params.guestName ?? null,
          guestEmail: params.guestEmail ?? null,
          guestPhone: params.guestPhone ?? null,
          subject: params.subject,
          description: params.description,
        },
      });
      await tx.ticketMessage.create({
        data: { ticketId: created.id, authorType: "CUSTOMER", isInternal: false, body: params.description },
      });
      return created;
    });

    const contactEmail = params.customerId
      ? (await db.user.findUnique({ where: { id: params.customerId }, select: { email: true } }))?.email
      : params.guestEmail;
    const customerName = params.customerId
      ? (await db.user.findUnique({ where: { id: params.customerId }, select: { name: true } }))?.name
      : params.guestName;

    await sendTicketEmail({
      ticketId: ticket.id,
      to: contactEmail,
      userId: params.customerId,
      templateKey: "ticket_created",
      variables: { customer_name: customerName ?? "there", ticket_number: ticket.ticketNumber, ticket_subject: params.subject },
    });

    return { id: ticket.id, ticketNumber: ticket.ticketNumber };
  } catch (err) {
    console.error("[customer-care] createTicketFromSystemEvent failed", err);
    await db.auditLog
      .create({
        data: {
          action: "TICKET_AUTO_CREATE_FAILED",
          entityType: "Ticket",
          entityId: params.orderId ?? null,
          meta: { source: params.source, category: params.category, error: String(err) },
        },
      })
      .catch(() => {});
    return null;
  }
}

/**
 * Appends a SYSTEM/internal log entry to the most recent ticket matching an order+category —
 * used when a follow-up event (e.g. a return-linked refund) shouldn't spawn a second ticket
 * but staff should still see it in the original ticket's thread. Best-effort, never throws.
 */
export async function appendSystemMessageToTicket(params: { orderId: string; category: TicketCategory; body: string }): Promise<void> {
  try {
    const ticket = await db.ticket.findFirst({
      where: { orderId: params.orderId, category: params.category },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!ticket) return;
    await db.ticketMessage.create({
      data: { ticketId: ticket.id, authorType: "SYSTEM", isInternal: true, body: params.body },
    });
  } catch (err) {
    console.error("[customer-care] appendSystemMessageToTicket failed", err);
  }
}
