import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { CustomerNotes } from "../CustomerNotes";

export const metadata = { title: "Customer Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [customer, settings, session] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" } },
        wishlistItems: { include: { product: { select: { name: true, slug: true } } } },
        addresses: true,
      },
    }),
    getSettings(),
    auth(),
  ]);

  if (!customer) notFound();

  const spend = customer.orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">{customer.name ?? "Customer"}</h1>
        <p className="text-sm text-ink-soft">{customer.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Orders</p>
          <p className="mt-1 font-display text-2xl">{customer.orders.length}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Total Spend</p>
          <p className="mt-1 font-display text-2xl">
            {settings.currencySymbol} {spend.toFixed(0)}
          </p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Wishlist</p>
          <p className="mt-1 font-display text-2xl">{customer.wishlistItems.length}</p>
        </div>
        <div className="border border-line bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Joined</p>
          <p className="mt-1 font-display text-2xl">{customer.createdAt.toLocaleDateString()}</p>
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
                <Td className="text-right">
                  {settings.currencySymbol} {Number(o.total).toFixed(2)}
                </Td>
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

      <div>
        <h2 className="mb-3 font-display text-lg">Notes</h2>
        <CustomerNotes userId={customer.id} initialNotes={customer.notes ?? ""} canEdit={session?.user.role === "SUPER_ADMIN"} />
      </div>
    </div>
  );
}
