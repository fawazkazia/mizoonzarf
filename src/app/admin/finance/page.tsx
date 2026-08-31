import { db } from "@/lib/db";
import { getProfitAndLoss, getAccountsReceivableTotal, getAccountsPayableTotal } from "@/lib/finance/reports";
import { resolvePresetRange } from "@/lib/data/date-presets";
import { formatINR } from "@/lib/currency";
import { StatCard } from "@/components/admin/StatCard";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Finance Dashboard" };

export default async function FinanceDashboardPage() {
  const range = resolvePresetRange("this_month");
  const [pl, receivable, payable, postingFailures, inventoryValue] = await Promise.all([
    getProfitAndLoss(range),
    getAccountsReceivableTotal(),
    getAccountsPayableTotal(),
    db.auditLog.findMany({ where: { action: "JOURNAL_POST_FAILED" }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.productVariant.aggregate({ _sum: { stock: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Finance</h1>
        <div className="flex gap-3">
          <ButtonLink href="/admin/suppliers" variant="secondary">
            Suppliers
          </ButtonLink>
          <ButtonLink href="/admin/purchase-orders" variant="secondary">
            Purchase Orders
          </ButtonLink>
          <ButtonLink href="/admin/expenses">Expenses</ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Money Customers Owe (AR)" value={formatINR(receivable)} hint="Unpaid sales invoices" href="/admin/finance/reports/ar-aging" />
        <StatCard label="Money We Owe Suppliers (AP)" value={formatINR(payable)} hint="Unpaid purchase invoices" href="/admin/finance/reports/ap-aging" />
        <StatCard label="This Month — Net Sales" value={formatINR(pl.netRevenue)} />
        <StatCard label="This Month — Net Profit" value={formatINR(pl.netProfit)} tone={pl.netProfit < 0 ? "warning" : "default"} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">Reports</h2>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/admin/finance/reports/profit-loss" variant="secondary">
            Profit &amp; Loss
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/balance-sheet" variant="secondary">
            Balance Sheet
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/cash-flow" variant="secondary">
            Cash Flow
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/product-profitability" variant="secondary">
            Product Profitability
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/customer-profitability" variant="secondary">
            Customer Profitability
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/inventory-valuation" variant="secondary">
            Inventory Valuation
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/tax" variant="secondary">
            Tax Report
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/ar-aging" variant="secondary">
            AR Aging
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/ap-aging" variant="secondary">
            AP Aging
          </ButtonLink>
          <ButtonLink href="/admin/finance/reports/supplier-purchases" variant="secondary">
            Supplier Purchases
          </ButtonLink>
          <ButtonLink href="/admin/finance/chart-of-accounts" variant="secondary">
            Chart of Accounts
          </ButtonLink>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">Posting Failures</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Ledger entries that failed to post automatically (e.g. a missing chart-of-accounts entry). Fix the underlying issue,
          then re-trigger the event (e.g. re-save the order&apos;s payment status) to post it.
        </p>
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Entity</Th>
              <Th>Details</Th>
            </tr>
          </thead>
          <tbody>
            {postingFailures.length === 0 && <EmptyRow colSpan={3}>No posting failures — the ledger is up to date.</EmptyRow>}
            {postingFailures.map((log) => (
              <tr key={log.id}>
                <Td>{log.createdAt.toLocaleString("en-IN")}</Td>
                <Td>
                  {log.entityType} {log.entityId}
                </Td>
                <Td className="max-w-md truncate text-xs text-ink-soft">{JSON.stringify(log.meta)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <p className="text-xs text-ink-soft">Units on hand across all warehouses: {inventoryValue._sum.stock ?? 0}</p>
    </div>
  );
}
