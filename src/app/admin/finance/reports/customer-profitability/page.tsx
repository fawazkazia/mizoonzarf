import { getCustomerProfitability } from "@/lib/finance/reports";
import { formatINR } from "@/lib/currency";
import { ButtonLink } from "@/components/ui/Button";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ReportDateFilter, resolveReportRange } from "@/components/admin/ReportDateFilter";

export const metadata = { title: "Customer Profitability" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

export default async function CustomerProfitabilityPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { preset, range } = resolveReportRange(sp);
  const rows = await getCustomerProfitability(range);
  const exportQuery = new URLSearchParams({ type: "customer-profitability", from: range.from.toISOString(), to: range.to.toISOString() }).toString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Customer Profitability</h1>
        <ButtonLink href={`/api/admin/finance/export?${exportQuery}`} variant="secondary">
          Export CSV
        </ButtonLink>
      </div>
      <ReportDateFilter basePath="/admin/finance/reports/customer-profitability" activePreset={preset} from={range.from.toISOString().slice(0, 10)} to={range.to.toISOString().slice(0, 10)} />

      <Table>
        <thead>
          <tr>
            <Th>Customer</Th>
            <Th>Orders</Th>
            <Th>Revenue</Th>
            <Th>Discounts</Th>
            <Th>COGS</Th>
            <Th>Gross Profit</Th>
            <Th>Avg. Order Value</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={7}>No paid orders in this range.</EmptyRow>}
          {rows.map((r) => (
            <tr key={r.key}>
              <Td className="font-medium">{r.label}</Td>
              <Td>{r.orders}</Td>
              <Td>{formatINR(r.revenue)}</Td>
              <Td>{formatINR(r.discounts)}</Td>
              <Td>{formatINR(r.cogs)}</Td>
              <Td>{formatINR(r.grossProfit)}</Td>
              <Td>{formatINR(r.avgOrderValue)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
