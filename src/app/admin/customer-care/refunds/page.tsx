import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import type { Prisma, RefundStatus } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Refunds" };

const STATUSES: RefundStatus[] = ["PENDING", "PROCESSED", "FAILED"];
const STATUS_TONE: Record<RefundStatus, "ink" | "sale" | "success" | "outline"> = {
  PENDING: "outline",
  PROCESSED: "success",
  FAILED: "sale",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function RefundsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const where: Prisma.RefundWhereInput = {};
  if (sp.status) where.status = sp.status as RefundStatus;

  const refunds = await db.refund.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { id: true, orderNumber: true, guestEmail: true, user: { select: { name: true, email: true } } } },
      return: { select: { status: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Refunds</h1>
      <StatusFilterSelect options={STATUSES} />

      <Table>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th className="text-right">Amount</Th>
            <Th>Reason</Th>
            <Th>Return-Linked</Th>
            <Th>Status</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {refunds.length === 0 && <EmptyRow colSpan={7}>No refunds found.</EmptyRow>}
          {refunds.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/admin/orders/${r.order.id}`} className="font-medium hover:underline">
                  {r.order.orderNumber}
                </Link>
              </Td>
              <Td>{r.order.user?.name ?? r.order.user?.email ?? r.order.guestEmail ?? "Guest"}</Td>
              <Td className="text-right">{formatINR(Number(r.amount))}</Td>
              <Td>{r.reason ?? "—"}</Td>
              <Td>{r.return ? r.return.status.replace(/_/g, " ") : "—"}</Td>
              <Td>
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              </Td>
              <Td>{r.createdAt.toLocaleDateString()}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
