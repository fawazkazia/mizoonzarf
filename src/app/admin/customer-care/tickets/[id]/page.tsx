import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_PRIORITY_LABEL, TICKET_PRIORITY_TONE } from "@/lib/customer-care/status";
import { computeSlaStatus } from "@/lib/customer-care/sla";
import { CUSTOMER_CARE_ROLES, CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { getCustomerCare360 } from "@/lib/data/customer-care-360";
import { CustomerCarePanel, GuestContactPanel } from "../../customers-panel/CustomerCarePanel";
import { OrderInfoPanel } from "../../customers-panel/OrderInfoPanel";
import { TicketStatusPanel } from "./TicketStatusPanel";
import { AssignmentPanel } from "./AssignmentPanel";
import { ReplyBox } from "./ReplyBox";

export const metadata = { title: "Ticket Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [ticket, session] = await Promise.all([
    db.ticket.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, email: true, role: true } } } },
        order: {
          include: {
            items: {
              include: {
                product: { select: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
                variant: { select: { imageUrl: true } },
              },
            },
            shipment: true,
            returns: { orderBy: { createdAt: "desc" }, take: 1 },
            refunds: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    auth(),
  ]);

  if (!ticket) notFound();

  const [staff, templates, customer360] = await Promise.all([
    db.user.findMany({ where: { role: { in: CUSTOMER_CARE_ROLES } }, select: { id: true, name: true, email: true } }),
    db.ticketReplyTemplate.findMany({
      where: { isActive: true, OR: [{ category: ticket.category }, { category: null }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true, body: true },
    }),
    ticket.customerId ? getCustomerCare360(ticket.customerId, ticket.id) : null,
  ]);

  const isManager = CUSTOMER_CARE_MANAGER_ROLES.includes(session!.user.role as never);
  const sla = computeSlaStatus(ticket);
  const contactPhone = ticket.customer?.phone ?? ticket.guestPhone;
  const contactEmail = ticket.customer?.email ?? ticket.guestEmail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl">{ticket.ticketNumber}</h1>
            <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
            <Badge tone={TICKET_PRIORITY_TONE[ticket.priority]}>{TICKET_PRIORITY_LABEL[ticket.priority]}</Badge>
            {sla.overdue && <Badge tone="sale">Overdue</Badge>}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {ticket.subject} · {ticket.category.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-ink-soft">
            Created {ticket.createdAt.toLocaleString()} · Updated {ticket.updatedAt.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="border border-line p-5">
            <h2 className="mb-4 font-display text-lg">Conversation</h2>
            <ul className="flex flex-col gap-4">
              {ticket.messages.map((m) => (
                <li
                  key={m.id}
                  className={
                    m.isInternal
                      ? "border border-dashed border-orange-400/60 bg-orange-500/5 p-3"
                      : m.authorType === "CUSTOMER"
                        ? "border border-line bg-paper-dim p-3"
                        : "border border-line p-3"
                  }
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
                    <span className="font-medium text-ink">
                      {m.isInternal
                        ? "Internal Note"
                        : m.authorType === "CUSTOMER"
                          ? "Customer"
                          : m.authorType === "SYSTEM"
                            ? "System"
                            : (m.author?.name ?? m.author?.email ?? "Staff")}
                    </span>
                    <span>{m.createdAt.toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                  {m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noopener" className="h-16 w-16 overflow-hidden border border-line">
                          <img src={url} alt="Attachment" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {!m.isInternal && m.authorType === "EMPLOYEE" && (
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-soft">{m.emailSent ? "Sent" : "Not sent"}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <ReplyBox ticketId={ticket.id} templates={templates} hasPhone={!!contactPhone} hasEmail={!!contactEmail} />
        </div>

        <div className="flex flex-col gap-6">
          <TicketStatusPanel
            ticketId={ticket.id}
            currentStatus={ticket.status}
            currentPriority={ticket.priority}
            resolvedAt={ticket.resolvedAt}
            resolvedByName={ticket.resolvedBy?.name ?? ticket.resolvedBy?.email ?? null}
            closedAt={ticket.closedAt}
          />
          <AssignmentPanel ticketId={ticket.id} currentAssigneeId={ticket.assignedToId} staff={staff} canAssign={isManager} />
          {ticket.order && (
            <OrderInfoPanel
              order={{
                id: ticket.order.id,
                orderNumber: ticket.order.orderNumber,
                createdAt: ticket.order.createdAt,
                items: ticket.order.items.map((item) => ({
                  id: item.id,
                  productName: item.productName,
                  variantLabel: item.variantLabel,
                  quantity: item.quantity,
                  price: Number(item.price),
                  subtotal: Number(item.subtotal),
                  imageUrl: item.variant?.imageUrl || item.product?.images?.[0]?.url || null,
                })),
                subtotal: Number(ticket.order.subtotal),
                discountAmount: Number(ticket.order.discountAmount),
                shippingFee: Number(ticket.order.shippingFee),
                taxAmount: Number(ticket.order.taxAmount),
                total: Number(ticket.order.total),
                paymentMethod: ticket.order.paymentMethod,
                paymentStatus: ticket.order.paymentStatus,
                status: ticket.order.status,
                shippingAddress: ticket.order.shippingAddress as never,
                trackingNumber: ticket.order.shipment?.trackingNumber ?? null,
                courierName: ticket.order.shipment?.courierName ?? null,
                estimatedDelivery: ticket.order.shipment?.estimatedDelivery ?? null,
                cancelledAt: ticket.order.cancelledAt,
                cancellationReason: ticket.order.cancellationReason,
                returnStatus: ticket.order.returns[0]?.status ?? null,
                refundStatus: ticket.order.refunds[0]?.status ?? null,
              }}
            />
          )}
          {customer360 ? (
            <CustomerCarePanel data={customer360} />
          ) : (
            <GuestContactPanel name={ticket.guestName} email={ticket.guestEmail} phone={ticket.guestPhone} />
          )}
        </div>
      </div>
    </div>
  );
}
