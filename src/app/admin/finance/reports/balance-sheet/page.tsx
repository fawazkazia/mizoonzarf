import { getBalanceSheet } from "@/lib/finance/reports";
import { formatINR } from "@/lib/currency";
import { AsOfDatePicker } from "./AsOfDatePicker";

export const metadata = { title: "Balance Sheet" };

interface PageProps {
  searchParams: Promise<{ asOf?: string }>;
}

function Section({ title, lines, total }: { title: string; lines: { code: string; name: string; amount: number }[]; total: number }) {
  return (
    <div className="border border-line bg-paper p-6">
      <h2 className="mb-3 font-display text-lg">{title}</h2>
      {lines.length === 0 ? (
        <p className="text-sm text-ink-soft">None</p>
      ) : (
        lines.map((l) => (
          <div key={l.code} className="flex items-center justify-between border-b border-line py-2 text-sm">
            <span className="text-ink-soft">{l.name}</span>
            <span>{formatINR(l.amount)}</span>
          </div>
        ))
      )}
      <div className="flex items-center justify-between pt-3 font-medium">
        <span>Total {title}</span>
        <span>{formatINR(total)}</span>
      </div>
    </div>
  );
}

export default async function BalanceSheetPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const asOf = sp.asOf ? new Date(new Date(sp.asOf).setHours(23, 59, 59, 999)) : new Date();

  const bs = await getBalanceSheet({ asOf });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Balance Sheet</h1>
        <AsOfDatePicker value={asOf.toISOString().slice(0, 10)} />
      </div>

      {!bs.isBalanced && (
        <div className="border border-sale bg-sale/10 p-4 text-sm text-sale">
          Warning: Assets ({formatINR(bs.totalAssets)}) do not equal Liabilities + Equity (
          {formatINR(bs.totalLiabilities + bs.totalEquity)}). This should never happen — please check the Finance →
          Posting Failures worklist and the Chart of Accounts.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Assets" lines={bs.assets} total={bs.totalAssets} />
        <div className="flex flex-col gap-4">
          <Section title="Liabilities" lines={bs.liabilities} total={bs.totalLiabilities} />
          <div className="border border-line bg-paper p-6">
            <h2 className="mb-3 font-display text-lg">Equity</h2>
            {bs.equity.map((l) => (
              <div key={l.code} className="flex items-center justify-between border-b border-line py-2 text-sm">
                <span className="text-ink-soft">{l.name}</span>
                <span>{formatINR(l.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-b border-line py-2 text-sm">
              <span className="text-ink-soft">Current Earnings (unclosed profit to date)</span>
              <span>{formatINR(bs.currentEarnings)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 font-medium">
              <span>Total Equity</span>
              <span>{formatINR(bs.totalEquity)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
