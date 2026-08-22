import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import type { Prisma } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { SearchInput } from "@/components/admin/SearchInput";
import { Pagination } from "@/components/admin/Pagination";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Customers" };

const PER_PAGE = 20;
const VIP_THRESHOLD = 2000;
const FREQUENT_ORDER_COUNT = 3;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const settings = await getSettings();

  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (sp.q) {
    where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }];
  }

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { orders: { select: { total: true, status: true } } },
    }),
    db.user.count({ where }),
  ]);

  const isNew = (createdAt: Date) => Date.now() - createdAt.getTime() < 1000 * 60 * 60 * 24 * 30;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Customers</h1>

      <SearchInput placeholder="Search by name or email..." />

      <Table>
        <thead>
          <tr>
            <Th>Customer</Th>
            <Th>Orders</Th>
            <Th>Total Spend</Th>
            <Th>Segment</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && <EmptyRow colSpan={5}>No customers found.</EmptyRow>}
          {customers.map((c) => {
            const validOrders = c.orders.filter((o) => o.status !== "CANCELLED");
            const spend = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
            const segment = spend >= VIP_THRESHOLD ? "VIP" : validOrders.length >= FREQUENT_ORDER_COUNT ? "Frequent" : isNew(c.createdAt) ? "New" : validOrders.length === 0 ? "Inactive" : "Regular";

            return (
              <tr key={c.id}>
                <Td>
                  <Link href={`/admin/customers/${c.id}`} className="hover:underline">
                    <p className="font-medium">{c.name ?? "—"}</p>
                    <p className="text-xs text-ink-soft">{c.email}</p>
                  </Link>
                </Td>
                <Td>{validOrders.length}</Td>
                <Td>
                  {settings.currencySymbol} {spend.toFixed(2)}
                </Td>
                <Td>
                  <Badge tone={segment === "VIP" ? "gold" : segment === "Inactive" ? "outline" : "ink"}>{segment}</Badge>
                </Td>
                <Td>{c.createdAt.toLocaleDateString()}</Td>
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
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
