import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import type { Prisma, ReturnStatus } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Returns" };

const STATUSES: ReturnStatus[] = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP", "RECEIVED", "REFUND_PROCESSING", "REFUNDED"];

const STATUS_TONE: Record<string, "ink" | "sale" | "success" | "outline"> = {
  REQUESTED: "ink",
  REJECTED: "sale",
  REFUNDED: "success",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminReturnsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const where: Prisma.ReturnWhereInput = {};
  if (sp.status) where.status = sp.status as ReturnStatus;

  const returns = await db.return.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true, guestEmail: true, user: { select: { name: true, email: true } } } },
      orderItem: { select: { productName: true, variantLabel: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Returns &amp; Refunds</h1>
        <ButtonLink href="/admin/returns/scan" variant="secondary">
          Scan Return
        </ButtonLink>
      </div>

      <StatusFilterSelect options={STATUSES} />

      <Table>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Product</Th>
            <Th>Reason</Th>
            <Th>Requested</Th>
            <Th>Status</Th>
            <Th className="text-right">Refund</Th>
          </tr>
        </thead>
        <tbody>
          {returns.length === 0 && <EmptyRow colSpan={7}>No return requests.</EmptyRow>}
          {returns.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/admin/returns/${r.id}`} className="font-medium hover:underline">
                  {r.order.orderNumber}
                </Link>
              </Td>
              <Td>{r.order.user?.name ?? r.order.user?.email ?? r.order.guestEmail ?? "Guest"}</Td>
              <Td>
                {r.orderItem?.productName}
                {r.orderItem?.variantLabel && ` (${r.orderItem.variantLabel})`}
              </Td>
              <Td>{r.reason}</Td>
              <Td>{r.createdAt.toLocaleDateString()}</Td>
              <Td>
                <Badge tone={STATUS_TONE[r.status] ?? "ink"}>{r.status.replace(/_/g, " ")}</Badge>
              </Td>
              <Td className="text-right">{r.refundAmount != null ? formatINR(Number(r.refundAmount)) : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
