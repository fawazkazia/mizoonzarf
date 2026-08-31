import { getProductProfitability } from "@/lib/finance/reports";
import { formatINR } from "@/lib/currency";
import { ButtonLink } from "@/components/ui/Button";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ReportDateFilter, resolveReportRange } from "@/components/admin/ReportDateFilter";

export const metadata = { title: "Product Profitability" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

export default async function ProductProfitabilityPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { preset, range } = resolveReportRange(sp);
  const rows = await getProductProfitability(range);
  const exportQuery = new URLSearchParams({ type: "product-profitability", from: range.from.toISOString(), to: range.to.toISOString() }).toString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Product Profitability</h1>
        <ButtonLink href={`/api/admin/finance/export?${exportQuery}`} variant="secondary">
          Export CSV
        </ButtonLink>
      </div>
      <ReportDateFilter basePath="/admin/finance/reports/product-profitability" activePreset={preset} from={range.from.toISOString().slice(0, 10)} to={range.to.toISOString().slice(0, 10)} />

      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Units Sold</Th>
            <Th>Revenue</Th>
            <Th>Discounts</Th>
            <Th>COGS</Th>
            <Th>Gross Profit</Th>
            <Th>Margin %</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={7}>No paid orders in this range.</EmptyRow>}
          {rows.map((r) => (
            <tr key={r.productId}>
              <Td className="font-medium">{r.productName}</Td>
              <Td>{r.unitsSold}</Td>
              <Td>{formatINR(r.revenue)}</Td>
              <Td>{formatINR(r.discounts)}</Td>
              <Td>{formatINR(r.cogs)}</Td>
              <Td>{formatINR(r.grossProfit)}</Td>
              <Td>{r.marginPct.toFixed(1)}%</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
