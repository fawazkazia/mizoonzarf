"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { CUSTOMER_CARE_ROLES, CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { sendTicketEmail } from "@/lib/notifications/ticket-email";
import { sendWhatsAppFreeformBestEffort } from "@/lib/notifications/whatsapp";
import { TICKET_STATUS_TRANSITIONS } from "@/lib/customer-care/status";
import type { Prisma, TicketStatus, TicketPriority } from "@/generated/prisma/client";

async function loadTicketContact(ticketId: string) {
  const ticket = await db.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
  });
  return {
    ticket,
    email: ticket.customer?.email ?? ticket.guestEmail,
    phone: ticket.customer?.phone ?? ticket.guestPhone,
    name: ticket.customer?.name ?? ticket.guestName ?? "there",
  };
}

function revalidateTicket(ticketId: string) {
  revalidatePath(`/admin/customer-care/tickets/${ticketId}`);
  revalidatePath("/admin/customer-care/tickets");
  revalidatePath("/admin/customer-care");
}

/** Sends a customer-visible reply over Email or (best-effort) WhatsApp, logs it in the thread,
 * and stamps firstRespondedAt on the first such reply. */
export async function replyToTicket(ticketId: string, params: { body: string; channel: "EMAIL" | "WHATSAPP"; attachments?: string[] }) {
  const session = await requireRole(CUSTOMER_CARE_ROLES);
  const { ticket, email, phone } = await loadTicketContact(ticketId);

  const message = await db.ticketMessage.create({
    data: {
      ticketId,
      authorType: "EMPLOYEE",
      authorId: session.user.id,
      isInternal: false,
      body: params.body,
      attachments: params.attachments ?? [],
    },
  });

  let sent = false;
  if (params.channel === "EMAIL") {
    sent = await sendTicketEmail({
      ticketId,
      to: email,
      userId: ticket.customerId,
      templateKey: "ticket_reply",
      bodyOverride: params.body,
      subjectOverride: `Re: ${ticket.subject} (${ticket.ticketNumber})`,
    });
  } else if (phone) {
    sent = await sendWhatsAppFreeformBestEffort(phone, params.body);
  }
  if (sent) {
    await db.ticketMessage.update({ where: { id: message.id }, data: { emailSent: true } });
  }

  const data: Prisma.TicketUncheckedUpdateInput = {};
  if (!ticket.firstRespondedAt) data.firstRespondedAt = new Date();
  if (ticket.status === "NEW") data.status = "OPEN";
  if (Object.keys(data).length > 0) {
    await db.ticket.update({ where: { id: ticketId }, data });
  }

  revalidateTicket(ticketId);
}

/** Staff-only note — never emailed or shown to the customer (see the isInternal gate on TicketMessage). */
export async function addInternalNote(ticketId: string, body: string, attachments?: string[]) {
  const session = await requireRole(CUSTOMER_CARE_ROLES);
  await db.ticketMessage.create({
    data: { ticketId, authorType: "EMPLOYEE", authorId: session.user.id, isInternal: true, body, attachments: attachments ?? [] },
  });
  revalidateTicket(ticketId);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const session = await requireRole(CUSTOMER_CARE_ROLES);
  const ticket = await db.ticket.findUniqueOrThrow({ where: { id: ticketId } });

  const allowed = TICKET_STATUS_TRANSITIONS[ticket.status];
  if (ticket.status !== status && !allowed.includes(status)) {
    throw new Error(`Cannot move a ${ticket.status.replace(/_/g, " ")} ticket to ${status.replace(/_/g, " ")}.`);
  }
  if (status === "CLOSED" && !CUSTOMER_CARE_MANAGER_ROLES.includes(session.user.role as never)) {
    throw new Error("Only a Customer Care Manager can close a ticket.");
  }

  const data: Prisma.TicketUncheckedUpdateInput = { status };
  if (status === "RESOLVED") {
    data.resolvedAt = new Date();
    data.resolvedById = session.user.id;
  }
  if (status === "CLOSED") data.closedAt = new Date();

  await db.ticket.update({ where: { id: ticketId }, data });
  await db.ticketMessage.create({
    data: {
      ticketId,
      authorType: "SYSTEM",
      isInternal: true,
      body: `Status changed to ${status.replace(/_/g, " ")} by ${session.user.name ?? session.user.email}.`,
    },
  });

  if (status === "RESOLVED") {
    const { email, name } = await loadTicketContact(ticketId);
    await sendTicketEmail({
      ticketId,
      to: email,
      userId: ticket.customerId,
      templateKey: "ticket_resolved",
      variables: { customer_name: name, ticket_number: ticket.ticketNumber, ticket_subject: ticket.subject },
    });
  }

  revalidateTicket(ticketId);
}

export async function updateTicketPriority(ticketId: string, priority: TicketPriority) {
  await requireRole(CUSTOMER_CARE_ROLES);
  await db.ticket.update({ where: { id: ticketId }, data: { priority } });
  revalidateTicket(ticketId);
}

/** Manager-only — assigns/reassigns/unassigns, and logs it so staff can see who's already working
 * a ticket instead of two people picking it up blind. */
export async function assignTicket(ticketId: string, assignedToId: string | null) {
  await requireRole(CUSTOMER_CARE_MANAGER_ROLES);
  await db.ticket.update({ where: { id: ticketId }, data: { assignedToId, assignedAt: assignedToId ? new Date() : null } });

  let noteBody = "Ticket unassigned.";
  if (assignedToId) {
    const assignee = await db.user.findUnique({ where: { id: assignedToId }, select: { name: true, email: true } });
    noteBody = `Ticket assigned to ${assignee?.name ?? assignee?.email ?? "staff member"}.`;
  }
  await db.ticketMessage.create({ data: { ticketId, authorType: "SYSTEM", isInternal: true, body: noteBody } });

  revalidateTicket(ticketId);
}
