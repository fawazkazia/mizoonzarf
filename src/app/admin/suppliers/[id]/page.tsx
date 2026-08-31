import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/currency";
import { RecordPaymentForm } from "../RecordPaymentForm";

export const metadata = { title: "Supplier" };

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await db.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      invoices: { where: { type: "PURCHASE" }, orderBy: { issueDate: "desc" } },
    },
  });
  if (!supplier) notFound();

  const outstanding = supplier.invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{supplier.name}</h1>
          <p className="text-sm text-ink-soft">{supplier.code}</p>
        </div>
        <div className="flex gap-3">
          <ButtonLink href={`/admin/purchase-orders/new?supplierId=${supplier.id}`}>+ New Purchase Order</ButtonLink>
          <ButtonLink href={`/admin/suppliers/${supplier.id}/edit`} variant="secondary">
            Edit
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Outstanding — money we owe</p>
          <p className="mt-1 font-display text-2xl">{formatINR(outstanding)}</p>
        </div>
        <div className="border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Purchase Orders</p>
          <p className="mt-1 font-display text-2xl">{supplier.purchaseOrders.length}</p>
        </div>
        <div className="border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Contact</p>
          <p className="mt-1 text-sm">{supplier.contactName || "—"}</p>
          <p className="text-sm text-ink-soft">{supplier.email || supplier.phone || "—"}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">Purchase History</h2>
        <Table>
          <thead>
            <tr>
              <Th>PO Number</Th>
              <Th>Status</Th>
              <Th>Lines</Th>
              <Th>Total Cost</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {supplier.purchaseOrders.length === 0 && <EmptyRow colSpan={5}>No purchase orders yet.</EmptyRow>}
            {supplier.purchaseOrders.map((po) => {
              const total = po.items.reduce((sum, item) => sum + Number(item.unitCost) * item.quantityOrdered, 0);
              return (
                <tr key={po.id}>
                  <Td className="font-medium">
                    <Link href={`/admin/purchase-orders/${po.id}`} className="hover:underline">
                      {po.poNumber}
                    </Link>
                  </Td>
                  <Td>
                    <Badge tone="outline">{po.status.replace(/_/g, " ")}</Badge>
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

      <div>
        <h2 className="mb-3 font-display text-xl">Invoices</h2>
        <Table>
          <thead>
            <tr>
              <Th>Invoice #</Th>
              <Th>Issue Date</Th>
              <Th>Total</Th>
              <Th>Paid</Th>
              <Th>Status</Th>
              <Th className="text-right">Record Payment</Th>
            </tr>
          </thead>
          <tbody>
            {supplier.invoices.length === 0 && <EmptyRow colSpan={6}>No invoices yet.</EmptyRow>}
            {supplier.invoices.map((inv) => {
              const outstandingOnInvoice = Number(inv.total) - Number(inv.amountPaid);
              return (
                <tr key={inv.id}>
                  <Td className="font-medium">{inv.invoiceNumber}</Td>
                  <Td>{inv.issueDate.toLocaleDateString("en-IN")}</Td>
                  <Td>{formatINR(Number(inv.total))}</Td>
                  <Td>{formatINR(Number(inv.amountPaid))}</Td>
                  <Td>
                    <Badge tone="outline">{inv.status.replace(/_/g, " ")}</Badge>
                  </Td>
                  <Td className="text-right">
                    {outstandingOnInvoice > 0.01 ? (
                      <RecordPaymentForm invoiceId={inv.id} outstanding={round2(outstandingOnInvoice)} />
                    ) : (
                      "—"
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
