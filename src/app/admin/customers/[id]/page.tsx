import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Mail } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import { getCustomerProfile } from "@/lib/data/customer-profile";
import { getOrderStatusDisplay } from "@/lib/orders/status";
import { CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { StatCard } from "@/components/admin/StatCard";
import { CustomerNotes } from "../CustomerNotes";
import { ReliabilityOverride } from "../ReliabilityOverride";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "@/lib/customer-care/status";
import { EditCustomerModal } from "./EditCustomerModal";
import { CustomerNotesLog } from "./CustomerNotesLog";
import { CustomerTags } from "./CustomerTags";

export const metadata = { title: "Customer Profile" };

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_TONE: Record<string, "ink" | "sale" | "success" | "outline" | "warning"> = {
  New: "outline",
  Active: "success",
  Dormant: "warning",
};

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [profile, session, notesRows] = await Promise.all([
    getCustomerProfile(id),
    auth(),
    db.customerNote.findMany({ where: { customerId: id }, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } } } }),
  ]);
  if (!profile) notFound();

  const {
    customer,
    totalOrders,
    totalSpend,
    avgOrderValue,
    lastOrder,
    currentOrders,
    cancelledOrders,
    returns,
    refunds,
    tickets,
    wishlistItems,
    timeline,
    status,
  } = profile;

  const canEditDetails = CUSTOMER_CARE_MANAGER_ROLES.includes(session!.user.role as never);
  const canEditNotes = session?.user.role === "SUPER_ADMIN";
  const defaultAddress = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0] ?? null;
  const reliability = customer.reliabilityOverride ?? customer.reliabilityStatus;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border border-line bg-paper p-6 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl">{customer.name ?? "Customer"}</h1>
            <Badge tone={STATUS_TONE[status]}>{status}</Badge>
            <Badge tone={reliability === "TRUSTED" ? "success" : reliability === "HIGH_RISK" ? "sale" : "outline"}>
              {reliability.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-ink-soft">Customer ID: {customer.id}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {customer.phone ? (
              <a href={`tel:${customer.phone}`} className="hover:underline">
                {customer.phone}
              </a>
            ) : (
              <span className="text-ink-soft">No mobile number on file</span>
            )}
            <a href={`mailto:${customer.email}`} className="hover:underline">
              {customer.email}
            </a>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Customer since {customer.createdAt.toLocaleDateString()}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={customer.phoneVerifiedAt ? "success" : "outline"}>{customer.phoneVerifiedAt ? "✓ Mobile Verified" : "Mobile Not Verified"}</Badge>
            <Badge tone={customer.emailVerified ? "success" : "outline"}>{customer.emailVerified ? "✓ Email Verified" : "Email Not Verified"}</Badge>
          </div>
          <div className="mt-3">
            <CustomerTags userId={customer.id} initialTags={customer.tags} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {customer.phone && (
            <ButtonLink href={`tel:${customer.phone}`} variant="secondary" size="sm">
              <Phone size={14} /> Call
            </ButtonLink>
          )}
          {customer.phone && (
            <ButtonLink href={waLink(customer.phone)} target="_blank" rel="noopener" variant="secondary" size="sm">
              <MessageCircle size={14} /> WhatsApp
            </ButtonLink>
          )}
          <ButtonLink href={`mailto:${customer.email}`} variant="secondary" size="sm">
            <Mail size={14} /> Email
          </ButtonLink>
          {canEditDetails && (
            <EditCustomerModal
              customer={{
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString().slice(0, 10) : null,
                gender: customer.gender,
              }}
              address={{
                id: defaultAddress?.id ?? null,
                fullName: defaultAddress?.fullName ?? customer.name ?? "",
                phone: defaultAddress?.phone ?? customer.phone ?? "",
                line1: defaultAddress?.line1 ?? "",
                line2: defaultAddress?.line2 ?? "",
                city: defaultAddress?.city ?? "",
                state: defaultAddress?.state ?? "",
                postalCode: defaultAddress?.postalCode ?? "",
                country: defaultAddress?.country ?? "IN",
              }}
            />
          )}
          <ButtonLink href="#order-history" variant="secondary" size="sm">
            View Orders
          </ButtonLink>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Orders" value={String(totalOrders)} />
        <StatCard label="Total Spent" value={formatINR(totalSpend)} />
        <StatCard label="Average Order Value" value={formatINR(avgOrderValue)} />
        <StatCard label="Last Order" value={lastOrder ? lastOrder.createdAt.toLocaleDateString() : "—"} />
        <StatCard label="Pending Orders" value={String(currentOrders.length)} tone={currentOrders.length > 0 ? "warning" : "default"} />
        <StatCard label="Returns" value={String(returns.length)} />
        <StatCard label="Cancelled Orders" value={String(cancelledOrders.length)} />
      </div>

      {/* Active orders */}
      {currentOrders.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg">Active Orders</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentOrders.map((o) => {
              const display = getOrderStatusDisplay(o.status, o.paymentStatus, o.paymentMethod);
              return (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="border border-line bg-paper p-4 transition-colors hover:border-ink"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{o.orderNumber}</p>
                    <Badge tone={display.tone}>{display.label}</Badge>
                  </div>
                  {o.shipment?.trackingNumber && <p className="mt-1 text-xs text-ink-soft">Tracking: {o.shipment.trackingNumber}</p>}
                  <p className="mt-1 text-xs text-ink-soft">{formatINR(Number(o.total))}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer information */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-line p-5">
          <h2 className="mb-3 font-display text-lg">Personal Details</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Full Name" value={customer.name ?? "—"} />
            <Row label="Mobile Number" value={customer.phone ?? "—"} />
            <Row label="Email" value={customer.email} />
            <Row label="Date of Birth" value={customer.dateOfBirth ? customer.dateOfBirth.toLocaleDateString() : "Not available"} />
            <Row label="Gender" value={customer.gender ?? "Not available"} />
          </dl>
        </div>
        <div className="border border-line p-5">
          <h2 className="mb-3 font-display text-lg">Address</h2>
          {defaultAddress ? (
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="House/Flat, Street" value={defaultAddress.line1} />
              <Row label="Area" value={defaultAddress.line2 || "—"} />
              <Row label="City" value={defaultAddress.city} />
              <Row label="State" value={defaultAddress.state || "—"} />
              <Row label="PIN/ZIP" value={defaultAddress.postalCode || "—"} />
              <Row label="Country" value={defaultAddress.country} />
            </dl>
          ) : (
            <p className="text-sm text-ink-soft">No saved address.</p>
          )}
        </div>
      </div>

      {/* Order history */}
      <div id="order-history">
        <h2 className="mb-3 font-display text-lg">Order History</h2>
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Products</Th>
              <Th className="text-right">Amount</Th>
              <Th>Payment</Th>
              <Th>Order Status</Th>
              <Th>Shipping</Th>
              <Th>Tracking #</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {customer.orders.length === 0 && <EmptyRow colSpan={9}>No orders yet.</EmptyRow>}
            {customer.orders.map((o) => {
              const display = getOrderStatusDisplay(o.status, o.paymentStatus, o.paymentMethod);
              const products = o.items.map((i) => `${i.productName} ×${i.quantity}`);
              const productsLabel = products.length > 2 ? `${products.slice(0, 2).join(", ")} +${products.length - 2} more` : products.join(", ");
              return (
                <tr key={o.id}>
                  <Td className="font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td>{o.createdAt.toLocaleDateString()}</Td>
                  <Td className="max-w-[220px] truncate">
                    <span title={products.join(", ")}>{productsLabel || "—"}</span>
                  </Td>
                  <Td className="text-right">{formatINR(Number(o.total))}</Td>
                  <Td>
                    <Badge tone={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "FAILED" ? "sale" : "outline"}>{o.paymentStatus}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={display.tone}>{display.label}</Badge>
                  </Td>
                  <Td>{o.shipment?.trackingStatus ?? "—"}</Td>
                  <Td>{o.shipment?.trackingNumber ?? "—"}</Td>
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="text-xs uppercase tracking-wide underline">
                      View
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* Returns & refunds */}
      <div>
        <h2 className="mb-3 font-display text-lg">Returns &amp; Refunds</h2>
        {returns.length === 0 && refunds.length === 0 ? (
          <p className="text-sm text-ink-soft">No returns or refunds on file.</p>
        ) : (
          <Table compact>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Reason</Th>
                <Th>Return Status</Th>
                <Th className="text-right">Refund Amount</Th>
                <Th>Refund Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => {
                const refund = refunds.find((f) => f.orderId === r.order.id);
                return (
                  <tr key={r.id}>
                    <Td>
                      <Link href={`/admin/orders/${r.order.id}`} className="hover:underline">
                        {r.order.orderNumber}
                      </Link>
                    </Td>
                    <Td>{r.reason}</Td>
                    <Td>
                      <Badge tone={r.status === "REFUNDED" ? "success" : r.status === "REJECTED" ? "sale" : "ink"}>{r.status.replace(/_/g, " ")}</Badge>
                    </Td>
                    <Td className="text-right">{r.refundAmount != null ? formatINR(Number(r.refundAmount)) : "—"}</Td>
                    <Td>{refund ? <Badge tone={refund.status === "PROCESSED" ? "success" : "outline"}>{refund.status}</Badge> : "—"}</Td>
                    <Td>{r.createdAt.toLocaleDateString()}</Td>
                  </tr>
                );
              })}
              {refunds
                .filter((f) => !returns.some((r) => r.order.id === f.orderId))
                .map((f) => (
                  <tr key={f.id}>
                    <Td>
                      <Link href={`/admin/orders/${f.order.id}`} className="hover:underline">
                        {f.order.orderNumber}
                      </Link>
                    </Td>
                    <Td>{f.reason ?? "—"}</Td>
                    <Td>—</Td>
                    <Td className="text-right">{formatINR(Number(f.amount))}</Td>
                    <Td>
                      <Badge tone={f.status === "PROCESSED" ? "success" : "outline"}>{f.status}</Badge>
                    </Td>
                    <Td>{f.createdAt.toLocaleDateString()}</Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Customer care queries */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Customer Care</h2>
          <ButtonLink href={`/admin/customer-care/tickets/new?customerEmail=${encodeURIComponent(customer.email)}`} size="sm">
            + New Customer Query
          </ButtonLink>
        </div>
        {tickets.length === 0 ? (
          <p className="text-sm text-ink-soft">No previous queries — this is the customer's first contact.</p>
        ) : (
          <Table compact>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Issue</Th>
                <Th>Order</Th>
                <Th>Employee</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <Td>{t.createdAt.toLocaleDateString()}</Td>
                  <Td>
                    <Link href={`/admin/customer-care/tickets/${t.id}`} className="hover:underline">
                      {t.subject}
                    </Link>
                    <span className="ml-2 text-xs text-ink-soft">({t.category.replace(/_/g, " ")})</span>
                  </Td>
                  <Td>{t.orderId ? <Link href={`/admin/orders/${t.orderId}`} className="hover:underline">View</Link> : "—"}</Td>
                  <Td>{t.assignedTo?.name ?? t.assignedTo?.email ?? "Unassigned"}</Td>
                  <Td>
                    <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Internal notes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg">Internal Notes</h2>
          <CustomerNotesLog
            userId={customer.id}
            notes={notesRows.map((n) => ({
              id: n.id,
              body: n.body,
              createdAt: n.createdAt.toLocaleString(),
              authorName: n.author?.name ?? n.author?.email ?? "Staff",
            }))}
          />
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 font-display text-lg">Pinned Summary Note</h2>
            <CustomerNotes userId={customer.id} initialNotes={customer.notes ?? ""} canEdit={canEditNotes} />
          </div>
          <div>
            <h2 className="mb-3 font-display text-lg">Reliability Status</h2>
            <ReliabilityOverride
              userId={customer.id}
              computedStatus={customer.reliabilityStatus}
              currentOverride={customer.reliabilityOverride}
              currentNote={customer.reliabilityOverrideNote}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="mb-3 font-display text-lg">Customer Activity Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-ink-soft">No activity yet.</p>
        ) : (
          <ol className="flex max-h-96 flex-col gap-0 overflow-y-auto border border-line">
            {timeline.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0">
                {e.href ? (
                  <Link href={e.href} className="hover:underline">
                    {e.label}
                  </Link>
                ) : (
                  <span>{e.label}</span>
                )}
                <span className="shrink-0 text-xs text-ink-soft">{e.date.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {wishlistItems.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg">Wishlist</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {wishlistItems.map((w) => (
              <li key={w.id}>
                <Link href={`/product/${w.product.slug}`} target="_blank" className="hover:underline">
                  {w.product.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
