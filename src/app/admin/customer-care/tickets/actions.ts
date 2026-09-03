"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { generateTicketNumber } from "@/lib/customer-care/ticket-number";
import { TicketCategory } from "@/generated/prisma/client";

const createTicketSchema = z.object({
  category: z.nativeEnum(TicketCategory),
  subcategory: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  subject: z.string().min(3),
  description: z.string().min(5),
  customerEmail: z.string().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  orderNumber: z.string().optional(),
});

/** Staff-initiated ticket (e.g. logging a phone call) — a customer can be looked up by email
 * (resolves to a real account) or entered as a guest (name/email/phone, no account). */
export async function createTicketManual(raw: z.infer<typeof createTicketSchema>) {
  const session = await requirePermission("support.createTickets");
  const input = createTicketSchema.parse(raw);

  const customer = input.customerEmail ? await db.user.findUnique({ where: { email: input.customerEmail }, select: { id: true } }) : null;
  const order = input.orderNumber ? await db.order.findUnique({ where: { orderNumber: input.orderNumber }, select: { id: true } }) : null;

  const ticket = await db.$transaction(async (tx) => {
    const ticketNumber = await generateTicketNumber(tx);
    const created = await tx.ticket.create({
      data: {
        ticketNumber,
        category: input.category,
        subcategory: input.subcategory || null,
        priority: input.priority,
        source: "MANUAL",
        subject: input.subject,
        description: input.description,
        customerId: customer?.id ?? null,
        guestName: customer ? null : input.guestName || null,
        guestEmail: customer ? null : input.customerEmail || null,
        guestPhone: customer ? null : input.guestPhone || null,
        orderId: order?.id ?? null,
        // Staff is creating this ticket themselves, so it's already "seen" — no badge for it.
        lastSeenByAdminAt: new Date(),
      },
    });
    await tx.ticketMessage.create({
      data: { ticketId: created.id, authorType: "CUSTOMER", isInternal: false, body: input.description },
    });
    return created;
  });

  await logStaffActivity({ actorId: session.user.id, action: "TICKET_CREATED", module: "support", entityType: "Ticket", entityId: ticket.id, after: { ticketNumber: ticket.ticketNumber, category: input.category } });
  revalidatePath("/admin/customer-care/tickets");
  revalidatePath("/admin/customer-care");
  return { id: ticket.id };
}
