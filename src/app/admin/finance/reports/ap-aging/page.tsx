import { getApAging } from "@/lib/finance/reports";
import { formatINR } from "@/lib/currency";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "AP Aging" };

const BUCKET_TONE: Record<string, "success" | "warning" | "sale" | "outline"> = {
  "Current (0-30)": "success",
  "31-60": "warning",
  "61-90": "sale",
  "90+": "sale",
};

export default async function ApAgingPage() {
  const report = await getApAging();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Accounts Payable Aging</h1>
      <p className="max-w-2xl text-sm text-ink-soft">
        Money we owe suppliers, bucketed by days since the purchase invoice was issued.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(report.byBucket).map(([bucket, amount]) => (
          <div key={bucket} className="border border-line bg-paper p-4">
            <Badge tone={BUCKET_TONE[bucket] ?? "outline"}>{bucket}</Badge>
            <p className="mt-2 font-display text-xl">{formatINR(amount)}</p>
          </div>
        ))}
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Invoice #</Th>
            <Th>Supplier</Th>
            <Th>Issue Date</Th>
            <Th>Outstanding</Th>
            <Th>Days</Th>
            <Th>Bucket</Th>
          </tr>
        </thead>
        <tbody>
          {report.lines.length === 0 && <EmptyRow colSpan={6}>No outstanding payables.</EmptyRow>}
          {report.lines.map((l) => (
            <tr key={l.invoiceId}>
              <Td className="font-medium">{l.invoiceNumber}</Td>
              <Td>{l.counterpartyName}</Td>
              <Td>{l.issueDate.toLocaleDateString("en-IN")}</Td>
              <Td>{formatINR(l.outstanding)}</Td>
              <Td>{l.daysSinceAnchor}</Td>
              <Td>
                <Badge tone={BUCKET_TONE[l.bucket] ?? "outline"}>{l.bucket}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
