import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Table, Th, Td } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/currency";
import { variantAttrs, formatAttrs } from "@/lib/inventory/variant-attributes";
import { POStatusActions } from "../POStatusActions";
import { ReceiveLineRow } from "../ReceiveLineRow";

export const metadata = { title: "Purchase Order" };

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      items: { include: { variant: { include: { product: { select: { name: true } } } } } },
    },
  });
  if (!po) notFound();

  const total = po.items.reduce((sum, item) => sum + Number(item.unitCost) * item.quantityOrdered, 0);
  const canReceive = ["SENT", "APPROVED", "PARTIALLY_RECEIVED"].includes(po.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{po.poNumber}</h1>
          <p className="text-sm text-ink-soft">
            {po.supplier.name} · {po.warehouse.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge tone="outline">{po.status.replace(/_/g, " ")}</Badge>
          <POStatusActions id={po.id} status={po.status} />
        </div>
      </div>

      {po.notes && <p className="text-sm text-ink-soft">{po.notes}</p>}

      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Ordered</Th>
            <Th>Received</Th>
            <Th>Unit Cost</Th>
            <Th>Line Total</Th>
            {canReceive && <Th>Receive</Th>}
          </tr>
        </thead>
        <tbody>
          {po.items.map((item) => (
            <tr key={item.id}>
              <Td>
                {item.variant.product.name}
                <br />
                <span className="text-xs text-ink-soft">{formatAttrs(variantAttrs(item.variant)) || "Default"}</span>
              </Td>
              <Td>{item.variant.sku}</Td>
              <Td>{item.quantityOrdered}</Td>
              <Td>{item.quantityReceived}</Td>
              <Td>{formatINR(Number(item.unitCost))}</Td>
              <Td>{formatINR(Number(item.unitCost) * item.quantityOrdered)}</Td>
              {canReceive && (
                <Td>
                  <ReceiveLineRow poItemId={item.id} remaining={item.quantityOrdered - item.quantityReceived} />
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>

      <p className="text-right text-sm font-medium">Total: {formatINR(total)}</p>
    </div>
  );
}
