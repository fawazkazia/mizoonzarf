import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import type { Prisma, OrderStatus } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Orders" };

const PER_PAGE = 20;
const STATUSES: OrderStatus[] = [
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const settings = await getSettings();

  const where: Prisma.OrderWhereInput = {};
  if (sp.q) {
    where.OR = [
      { orderNumber: { contains: sp.q, mode: "insensitive" } },
      { guestEmail: { contains: sp.q, mode: "insensitive" } },
      { user: { email: { contains: sp.q, mode: "insensitive" } } },
    ];
  }
  if (sp.status) where.status = sp.status as OrderStatus;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { name: true, email: true } }, items: { select: { id: true } } },
    }),
    db.order.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Orders</h1>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search order # or email..." />
        <StatusFilterSelect options={STATUSES} />
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Items</Th>
            <Th>Status</Th>
            <Th>Payment</Th>
            <Th className="text-right">Total</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && <EmptyRow colSpan={7}>No orders found.</EmptyRow>}
          {orders.map((o) => (
            <tr key={o.id}>
              <Td>
                <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                  {o.orderNumber}
                </Link>
              </Td>
              <Td>{o.user?.name ?? o.user?.email ?? o.guestEmail ?? "Guest"}</Td>
              <Td>{o.items.length}</Td>
              <Td>
                <Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "sale" : "ink"}>
                  {o.status.replace(/_/g, " ")}
                </Badge>
              </Td>
              <Td>
                <Badge tone={o.paymentStatus === "PAID" ? "success" : "outline"}>{o.paymentStatus}</Badge>
              </Td>
              <Td className="text-right">
                {settings.currencySymbol} {Number(o.total).toFixed(2)}
              </Td>
              <Td>{o.createdAt.toLocaleDateString()}</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.max(Math.ceil(total / PER_PAGE), 1)}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.q) params.set("q", sp.q);
          if (sp.status) params.set("status", sp.status);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
