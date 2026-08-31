import { getInventoryValuation } from "@/lib/finance/reports";
import { formatINR } from "@/lib/currency";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";

export const metadata = { title: "Inventory Valuation" };

export default async function InventoryValuationPage() {
  const valuation = await getInventoryValuation();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Inventory Valuation</h1>
      <p className="max-w-2xl text-sm text-ink-soft">
        Computed from current stock on hand × cost price, not the ledger&apos;s Inventory Asset account — manual
        stock adjustments, transfers, and return restocks don&apos;t all post to the ledger yet, so this is the more
        accurate current-state figure.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Total Inventory Value</p>
          <p className="mt-1 font-display text-2xl">{formatINR(valuation.totalValue)}</p>
          <p className="mt-1 text-xs text-ink-soft">{valuation.totalUnits} units on hand</p>
        </div>
        {valuation.uncostedUnits > 0 && (
          <div className="border border-sale/40 bg-sale/10 p-5">
            <p className="text-xs uppercase tracking-wide text-sale">Not Yet Costed</p>
            <p className="mt-1 font-display text-2xl">{valuation.uncostedUnits} units</p>
            <p className="mt-1 text-xs text-ink-soft">
              {valuation.uncostedVariantCount} variant(s) with stock but no cost price set — valued at ₹0 above. Set a
              cost price on the product form or receive a Purchase Order against them.
            </p>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">By Warehouse</h2>
        <Table>
          <thead>
            <tr>
              <Th>Warehouse</Th>
              <Th>Units</Th>
              <Th>Value</Th>
            </tr>
          </thead>
          <tbody>
            {valuation.byWarehouse.length === 0 && <EmptyRow colSpan={3}>No stock on hand.</EmptyRow>}
            {valuation.byWarehouse.map((w) => (
              <tr key={w.warehouseId}>
                <Td className="font-medium">{w.warehouseName}</Td>
                <Td>{w.units}</Td>
                <Td>{formatINR(w.value)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
