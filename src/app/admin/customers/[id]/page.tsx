import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { CustomerNotes } from "../CustomerNotes";
import { ReliabilityOverride } from "../ReliabilityOverride";

export const metadata = { title: "Customer Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [customer, session] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, include: { statusHistory: { select: { status: true } } } },
        wishlistItems: { include: { product: { select: { name: true, slug: true } } } },
        addresses: true,
      },
    }),
    auth(),
  ]);

  if (!customer) notFound();

  const spend = customer.orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + Number(o.total), 0);
  const cancelledOrders = customer.orders.filter((o) => o.status === "CANCELLED");
  const failedDeliveries = cancelledOrders.filter((o) =>
    o.statusHistory.some((h) => h.status === "SHIPPED" || h.status === "OUT_FOR_DELIVERY")
  ).length;
  const codOrders = customer.orders.filter((o) => o.paymentMethod === "COD").length;
  const prepaidOrders = customer.orders.length - codOrders;
  const reliability = customer.reliabilityOverride ?? customer.reliabilityStatus;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">{customer.name ?? "Customer"}</h1>
        <p className="text-sm text-ink-soft">{customer.email}</p>
        <p className="text-sm text-ink-soft">{customer.phone ?? "No mobile number on file"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone={customer.phoneVerifiedAt ? "success" : "outline"}>
            {customer.phoneVerifiedAt ? "✓ Mobile Verified" : "Mobile Not Verified"}
          </Badge>
          <Badge tone={reliability === "TRUSTED" ? "success" : reliability === "HIGH_RISK" ? "sale" : "outline"}>
            {reliability.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Orders</p>
          <p className="mt-1 font-display text-2xl">{customer.orders.length}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Total Spend</p>
          <p className="mt-1 font-display text-2xl">{formatINR(spend)}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Wishlist</p>
          <p className="mt-1 font-display text-2xl">{customer.wishlistItems.length}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Joined</p>
          <p className="mt-1 font-display text-2xl">{customer.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Cancelled</p>
          <p className="mt-1 font-display text-2xl">{cancelledOrders.length}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Failed Deliveries</p>
          <p className="mt-1 font-display text-2xl">{failedDeliveries}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">COD Orders</p>
          <p className="mt-1 font-display text-2xl">{codOrders}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Prepaid Orders</p>
          <p className="mt-1 font-display text-2xl">{prepaidOrders}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg">Orders</h2>
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {customer.orders.length === 0 && <EmptyRow colSpan={4}>No orders yet.</EmptyRow>}
            {customer.orders.map((o) => (
              <tr key={o.id}>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td>
                  <Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "sale" : "ink"}>{o.status.replace(/_/g, " ")}</Badge>
                </Td>
                <Td className="text-right">{formatINR(Number(o.total))}</Td>
                <Td>{o.createdAt.toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg">Wishlist</h2>
          {customer.wishlistItems.length === 0 ? (
            <p className="text-sm text-ink-soft">No wishlist items.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {customer.wishlistItems.map((w) => (
                <li key={w.id}>
                  <Link href={`/product/${w.product.slug}`} target="_blank" className="hover:underline">
                    {w.product.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg">Addresses</h2>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-ink-soft">No saved addresses.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {customer.addresses.map((a) => (
                <li key={a.id}>
                  {a.fullName} — {a.line1}, {a.city}, {a.country}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg">Notes</h2>
          <CustomerNotes userId={customer.id} initialNotes={customer.notes ?? ""} canEdit={session?.user.role === "SUPER_ADMIN"} />
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
  );
}
