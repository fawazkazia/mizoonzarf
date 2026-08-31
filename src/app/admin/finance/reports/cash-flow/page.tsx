import { getCashFlow } from "@/lib/finance/reports";
import { resolvePresetRange, DATE_PRESETS, type DatePreset } from "@/lib/data/date-presets";
import { formatINR } from "@/lib/currency";
import { CashFlowDateFilter } from "./CashFlowDateFilter";

export const metadata = { title: "Cash Flow" };

interface PageProps {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-line py-2.5 ${bold ? "font-medium" : ""}`}>
      <span className={bold ? "" : "pl-4 text-ink-soft"}>{label}</span>
      <span>{formatINR(value)}</span>
    </div>
  );
}

export default async function CashFlowPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const isValidPreset = (v?: string): v is DatePreset => !!v && (DATE_PRESETS as readonly string[]).includes(v);
  const preset: DatePreset | null = !sp.from && !sp.to ? (isValidPreset(sp.preset) ? sp.preset : "this_month") : null;
  const range = preset
    ? resolvePresetRange(preset)
    : {
        from: sp.from ? new Date(sp.from) : resolvePresetRange("30d").from,
        to: sp.to ? new Date(new Date(sp.to).setHours(23, 59, 59, 999)) : new Date(),
      };

  const cf = await getCashFlow(range);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Cash Flow</h1>
      <CashFlowDateFilter activePreset={preset} from={toDateInputValue(range.from)} to={toDateInputValue(range.to)} />

      <div className="max-w-xl border border-line bg-paper p-6">
        <Row label="Opening Balance" value={cf.openingBalance} bold />

        <p className="pb-1 pt-4 text-xs uppercase tracking-wide text-ink-soft">Inflows</p>
        {cf.inflows.length === 0 && <p className="pb-2 text-sm text-ink-soft">None</p>}
        {cf.inflows.map((l) => (
          <Row key={l.label} label={l.label} value={l.amount} />
        ))}
        <Row label="Total Inflows" value={cf.totalInflows} bold />

        <p className="pb-1 pt-4 text-xs uppercase tracking-wide text-ink-soft">Outflows</p>
        {cf.outflows.length === 0 && <p className="pb-2 text-sm text-ink-soft">None</p>}
        {cf.outflows.map((l) => (
          <Row key={l.label} label={l.label} value={l.amount} />
        ))}
        <Row label="Total Outflows" value={cf.totalOutflows} bold />

        <div className="flex items-center justify-between pt-4 font-display text-lg">
          <span>Closing Balance</span>
          <span>{formatINR(cf.closingBalance)}</span>
        </div>
      </div>
    </div>
  );
}
