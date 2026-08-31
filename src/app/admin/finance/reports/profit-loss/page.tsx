import { getProfitAndLoss } from "@/lib/finance/reports";
import { resolvePresetRange, DATE_PRESETS, type DatePreset } from "@/lib/data/date-presets";
import { formatINR } from "@/lib/currency";
import { ButtonLink } from "@/components/ui/Button";
import { ProfitLossDateFilter } from "./ProfitLossDateFilter";

export const metadata = { title: "Profit & Loss" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function Row({ label, value, indent, bold, negative }: { label: string; value: number; indent?: boolean; bold?: boolean; negative?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-line py-2.5 ${bold ? "font-medium" : ""}`}>
      <span className={indent ? "pl-4 text-ink-soft" : ""}>{label}</span>
      <span>
        {negative && value !== 0 ? "− " : ""}
        {formatINR(Math.abs(value))}
      </span>
    </div>
  );
}

export default async function ProfitLossPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const isValidPreset = (v?: string): v is DatePreset => !!v && (DATE_PRESETS as readonly string[]).includes(v);
  const preset: DatePreset | null = !sp.from && !sp.to ? (isValidPreset(sp.preset) ? sp.preset : "this_month") : null;
  const range = preset
    ? resolvePresetRange(preset)
    : {
        from: sp.from ? new Date(sp.from) : resolvePresetRange("30d").from,
        to: sp.to ? new Date(new Date(sp.to).setHours(23, 59, 59, 999)) : new Date(),
      };

  const pl = await getProfitAndLoss(range);
  const exportQuery = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() }).toString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Profit &amp; Loss</h1>
        <ButtonLink href={`/api/admin/finance/export?${exportQuery}`} variant="secondary">
          Export CSV
        </ButtonLink>
      </div>

      <ProfitLossDateFilter activePreset={preset} from={toDateInputValue(range.from)} to={toDateInputValue(range.to)} />

      <div className="max-w-xl border border-line bg-paper p-6">
        <Row label="Gross Sales" value={pl.grossSales} />
        <Row label="Discounts" value={pl.discounts} indent negative />
        <Row label="Returns & Refunds" value={pl.returns} indent negative />
        <Row label="Net Revenue" value={pl.netRevenue} bold />
        <Row label="Cost of Goods Sold" value={pl.cogs} indent negative />
        <Row label="Gross Profit" value={pl.grossProfit} bold />
        <div className="border-b border-line py-2.5 text-xs uppercase tracking-wide text-ink-soft">
          Gross Margin: {pl.grossMarginPct.toFixed(1)}%
        </div>

        {pl.expensesByCategory.length > 0 && (
          <div className="mt-4">
            <p className="pb-1 text-xs uppercase tracking-wide text-ink-soft">Operating Expenses</p>
            {pl.expensesByCategory.map((e) => (
              <Row key={e.category} label={e.category} value={e.amount} indent negative />
            ))}
          </div>
        )}
        <Row label="Operating Expenses" value={pl.operatingExpenses} negative bold />
        <Row label="Net Profit" value={pl.netProfit} bold />
        <div className="pt-2.5 text-xs uppercase tracking-wide text-ink-soft">Net Margin: {pl.netMarginPct.toFixed(1)}%</div>
      </div>
    </div>
  );
}
