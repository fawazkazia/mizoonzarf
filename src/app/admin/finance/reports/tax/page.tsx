import { getTaxReport } from "@/lib/finance/reports";
import { formatINR } from "@/lib/currency";
import { ButtonLink } from "@/components/ui/Button";
import { ReportDateFilter, resolveReportRange } from "@/components/admin/ReportDateFilter";

export const metadata = { title: "Tax Report" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-line py-2.5 ${bold ? "font-medium" : ""}`}>
      <span className={bold ? "" : "text-ink-soft"}>{label}</span>
      <span>{formatINR(value)}</span>
    </div>
  );
}

export default async function TaxReportPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { preset, range } = resolveReportRange(sp);
  const tax = await getTaxReport(range);
  const exportQuery = new URLSearchParams({ type: "tax", from: range.from.toISOString(), to: range.to.toISOString() }).toString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Tax Report</h1>
        <ButtonLink href={`/api/admin/finance/export?${exportQuery}`} variant="secondary">
          Export CSV
        </ButtonLink>
      </div>
      <ReportDateFilter basePath="/admin/finance/reports/tax" activePreset={preset} from={range.from.toISOString().slice(0, 10)} to={range.to.toISOString().slice(0, 10)} />

      <div className="max-w-xl border border-line bg-paper p-6">
        <Row label="GST Collected (this period)" value={tax.gstCollected} />
        <Row label="GST Reversed (refunds, this period)" value={tax.gstReversed} />
        <Row label="Net GST for Period" value={tax.netGstForPeriod} bold />
        <Row label="GST Payable Balance (as of period end)" value={tax.gstPayableBalance} bold />
      </div>
      <p className="max-w-xl text-xs text-ink-soft">{tax.purchaseSideTrackedNote}</p>
    </div>
  );
}
