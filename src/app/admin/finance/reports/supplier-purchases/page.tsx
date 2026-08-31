import Link from "next/link";
import { getSupplierPurchases } from "@/lib/finance/reports";
import { formatINR } from "@/lib/currency";
import { ButtonLink } from "@/components/ui/Button";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ReportDateFilter, resolveReportRange } from "@/components/admin/ReportDateFilter";

export const metadata = { title: "Supplier Purchases" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

export default async function SupplierPurchasesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { preset, range } = resolveReportRange(sp);
  const rows = await getSupplierPurchases(range);
  const exportQuery = new URLSearchParams({ type: "supplier-purchases", from: range.from.toISOString(), to: range.to.toISOString() }).toString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Supplier Purchases</h1>
        <ButtonLink href={`/api/admin/finance/export?${exportQuery}`} variant="secondary">
          Export CSV
        </ButtonLink>
      </div>
      <ReportDateFilter basePath="/admin/finance/reports/supplier-purchases" activePreset={preset} from={range.from.toISOString().slice(0, 10)} to={range.to.toISOString().slice(0, 10)} />

      <Table>
        <thead>
          <tr>
            <Th>Supplier</Th>
            <Th>Purchase Orders</Th>
            <Th>Total Ordered</Th>
            <Th>Total Received</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={4}>No purchase orders in this range.</EmptyRow>}
          {rows.map((r) => (
            <tr key={r.supplierId}>
              <Td className="font-medium">
                <Link href={`/admin/suppliers/${r.supplierId}`} className="hover:underline">
                  {r.supplierName}
                </Link>
              </Td>
              <Td>{r.poCount}</Td>
              <Td>{formatINR(r.totalOrdered)}</Td>
              <Td>{formatINR(r.totalReceived)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
