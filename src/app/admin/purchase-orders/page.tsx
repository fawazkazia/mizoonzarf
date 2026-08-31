import Link from "next/link";
import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/currency";

export const metadata = { title: "Purchase Orders" };

const STATUS_TONE: Record<string, "ink" | "sale" | "success" | "outline" | "warning"> = {
  DRAFT: "outline",
  SENT: "warning",
  APPROVED: "warning",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
  CLOSED: "ink",
  CANCELLED: "sale",
};

export default async function PurchaseOrdersPage() {
  const orders = await db.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, items: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Purchase Orders</h1>
        <ButtonLink href="/admin/purchase-orders/new">+ New Purchase Order</ButtonLink>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>PO Number</Th>
            <Th>Supplier</Th>
            <Th>Status</Th>
            <Th>Lines</Th>
            <Th>Total Cost</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && <EmptyRow colSpan={6}>No purchase orders yet.</EmptyRow>}
          {orders.map((po) => {
            const total = po.items.reduce((sum, item) => sum + Number(item.unitCost) * item.quantityOrdered, 0);
            return (
              <tr key={po.id}>
                <Td className="font-medium">
                  <Link href={`/admin/purchase-orders/${po.id}`} className="hover:underline">
                    {po.poNumber}
                  </Link>
                </Td>
                <Td>{po.supplier.name}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[po.status] ?? "outline"}>{po.status.replace(/_/g, " ")}</Badge>
                </Td>
                <Td>{po.items.length}</Td>
                <Td>{formatINR(total)}</Td>
                <Td>{po.createdAt.toLocaleDateString("en-IN")}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
