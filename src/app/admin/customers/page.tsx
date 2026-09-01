import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import type { Prisma, ReliabilityStatus } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Customers" };

const PER_PAGE = 20;
const VIP_THRESHOLD = 2000;
const FREQUENT_ORDER_COUNT = 3;
const RELIABILITY_STATUSES = ["TRUSTED", "NORMAL", "HIGH_RISK"];
const SUGGESTED_TAG_FILTERS = ["VIP", "Frequent Customer", "High Value", "Return Customer", "Payment Issue", "Delivery Issue", "Requires Follow-up"];

interface PageProps {
  searchParams: Promise<{ q?: string; reliability?: string; tag?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (sp.q) {
    // Matches name/email/phone directly, or an order number placed by the customer — an
    // employee on a call rarely has anything but one of these four to search by.
    where.OR = [
      { name: { contains: sp.q, mode: "insensitive" } },
      { email: { contains: sp.q, mode: "insensitive" } },
      { phone: { contains: sp.q, mode: "insensitive" } },
      { orders: { some: { orderNumber: { contains: sp.q, mode: "insensitive" } } } },
    ];
  }
  if (sp.tag) {
    where.tags = { has: sp.tag };
  }
  if (sp.reliability) {
    // Effective status is reliabilityOverride ?? reliabilityStatus — match either an explicit
    // override of this value, or the computed value when no override is set.
    where.AND = [
      {
        OR: [
          { reliabilityOverride: sp.reliability as ReliabilityStatus },
          { reliabilityOverride: null, reliabilityStatus: sp.reliability as ReliabilityStatus },
        ],
      },
    ];
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

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name, mobile number, email, or order ID..." />
        <StatusFilterSelect options={RELIABILITY_STATUSES} paramKey="reliability" placeholder="All Reliability" />
        <StatusFilterSelect options={SUGGESTED_TAG_FILTERS} paramKey="tag" placeholder="All Tags" />
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Customer</Th>
            <Th>Mobile</Th>
            <Th>Orders</Th>
            <Th>Total Spend</Th>
            <Th>Segment</Th>
            <Th>Tags</Th>
            <Th>Reliability</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && <EmptyRow colSpan={8}>No customers found.</EmptyRow>}
          {customers.map((c) => {
            const validOrders = c.orders.filter((o) => o.status !== "CANCELLED");
            const spend = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
            const segment = spend >= VIP_THRESHOLD ? "VIP" : validOrders.length >= FREQUENT_ORDER_COUNT ? "Frequent" : isNew(c.createdAt) ? "New" : validOrders.length === 0 ? "Inactive" : "Regular";
            const reliability = c.reliabilityOverride ?? c.reliabilityStatus;

            return (
              <tr key={c.id}>
                <Td>
                  <Link href={`/admin/customers/${c.id}`} className="hover:underline">
                    <p className="font-medium">{c.name ?? "—"}</p>
                    <p className="text-xs text-ink-soft">{c.email}</p>
                  </Link>
                </Td>
                <Td>{c.phone ?? "—"}</Td>
                <Td>{validOrders.length}</Td>
                <Td>{formatINR(spend)}</Td>
                <Td>
                  <Badge tone={segment === "VIP" ? "gold" : segment === "Inactive" ? "outline" : "ink"}>{segment}</Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <Badge key={tag} tone="gold">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td>
                  <Badge tone={reliability === "TRUSTED" ? "success" : reliability === "HIGH_RISK" ? "sale" : "outline"}>
                    {reliability.replace(/_/g, " ")}
                  </Badge>
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
          if (sp.reliability) params.set("reliability", sp.reliability);
          if (sp.tag) params.set("tag", sp.tag);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
