import { db } from "@/lib/db";
import { ACCOUNT_CODES } from "@/lib/finance/accounts";
import type { AnalyticsRange } from "@/lib/data/date-presets";

export interface ExpenseCategoryTotal {
  category: string;
  amount: number;
}

export interface ProfitAndLoss {
  grossSales: number;
  discounts: number;
  returns: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  expensesByCategory: ExpenseCategoryTotal[];
  operatingExpenses: number;
  netProfit: number;
  netMarginPct: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Queries the ledger directly (JournalLine.groupBy), not the in-memory Map-over-findMany
 * pattern used by src/lib/data/admin-analytics.ts — deliberately. Once the ledger exists, it
 * must be the sole source of truth for revenue/COGS/expenses, so the P&L is always a
 * re-statement of exactly what was posted, never a second parallel computation that could
 * silently disagree with it (e.g. if a refund only updated one side).
 */
export async function getProfitAndLoss({ from, to }: AnalyticsRange): Promise<ProfitAndLoss> {
  const sums = await db.journalLine.groupBy({
    by: ["accountId"],
    where: { entry: { date: { gte: from, lte: to } } },
    _sum: { debit: true, credit: true },
  });
  const accounts = await db.ledgerAccount.findMany();
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const netByCode = new Map<string, number>();
  for (const row of sums) {
    const account = accountById.get(row.accountId);
    if (!account) continue;
    const debit = Number(row._sum.debit ?? 0);
    const credit = Number(row._sum.credit ?? 0);
    // Non-contra REVENUE carries a normal credit balance (credit - debit is the positive
    // figure); everything else here — contra-revenue (Discounts/Returns), COGS, EXPENSE —
    // carries a normal debit balance, so debit - credit is what yields a positive "amount of
    // that thing" instead of a negative revenue adjustment.
    const net = account.type === "REVENUE" && !account.isContra ? credit - debit : debit - credit;
    netByCode.set(account.code, round2((netByCode.get(account.code) ?? 0) + net));
  }

  const grossSales = netByCode.get(ACCOUNT_CODES.SALES_REVENUE) ?? 0;
  const discounts = netByCode.get(ACCOUNT_CODES.SALES_DISCOUNTS) ?? 0;
  const returns = netByCode.get(ACCOUNT_CODES.SALES_RETURNS) ?? 0;
  const netRevenue = round2(grossSales - discounts - returns);
  const cogs = netByCode.get(ACCOUNT_CODES.COGS) ?? 0;
  const grossProfit = round2(netRevenue - cogs);

  const expensesByCategory = accounts
    .filter((a) => a.type === "EXPENSE")
    .map((a) => ({ category: a.name, amount: netByCode.get(a.code) ?? 0 }))
    .filter((e) => e.amount !== 0);
  const operatingExpenses = round2(expensesByCategory.reduce((sum, e) => sum + e.amount, 0));
  const netProfit = round2(grossProfit - operatingExpenses);

  return {
    grossSales,
    discounts,
    returns,
    netRevenue,
    cogs,
    grossProfit,
    grossMarginPct: netRevenue !== 0 ? round2((grossProfit / netRevenue) * 100) : 0,
    expensesByCategory,
    operatingExpenses,
    netProfit,
    netMarginPct: netRevenue !== 0 ? round2((netProfit / netRevenue) * 100) : 0,
  };
}

/** Sum of unpaid/partially-paid SALES invoices — "money customers owe us." */
export async function getAccountsReceivableTotal(): Promise<number> {
  const invoices = await db.invoice.findMany({
    where: { type: "SALES", status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
    select: { total: true, amountPaid: true },
  });
  return round2(invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)), 0));
}

/** Sum of unpaid/partially-paid PURCHASE invoices — "money we owe suppliers." */
export async function getAccountsPayableTotal(): Promise<number> {
  const invoices = await db.invoice.findMany({
    where: { type: "PURCHASE", status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
    select: { total: true, amountPaid: true },
  });
  return round2(invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)), 0));
}

export interface BalanceSheetLine {
  code: string;
  name: string;
  amount: number;
}

export interface BalanceSheet {
  asOf: Date;
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
  currentEarnings: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

/**
 * Point-in-time cumulative snapshot (every JournalLine from inception through `asOf`) — unlike
 * getProfitAndLoss, this is NOT a date-range query. "Current Earnings" reuses getProfitAndLoss
 * unmodified for the full lifetime-to-date range; this works because every JournalEntry is
 * balance-checked before insert, so the fundamental identity `Assets = Liabilities + Equity +
 * (Revenue - Expenses - COGS)` holds automatically across the whole ledger — no period-close
 * step is needed to make the two sides agree. `isBalanced` should always be true; it's a real
 * defensive check (per the spec's "clearly flag it for the accountant"), not decoration.
 */
export async function getBalanceSheet({ asOf }: { asOf: Date }): Promise<BalanceSheet> {
  const sums = await db.journalLine.groupBy({
    by: ["accountId"],
    where: { entry: { date: { lte: asOf } } },
    _sum: { debit: true, credit: true },
  });
  const accounts = await db.ledgerAccount.findMany();
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const netByCode = new Map<string, number>();
  for (const row of sums) {
    const account = accountById.get(row.accountId);
    if (!account || (account.type !== "ASSET" && account.type !== "LIABILITY" && account.type !== "EQUITY")) continue;
    const debit = Number(row._sum.debit ?? 0);
    const credit = Number(row._sum.credit ?? 0);
    // ASSET carries a normal debit balance; LIABILITY/EQUITY carry a normal credit balance.
    const net = account.type === "ASSET" ? debit - credit : credit - debit;
    netByCode.set(account.code, round2((netByCode.get(account.code) ?? 0) + net));
  }

  const toLines = (type: "ASSET" | "LIABILITY" | "EQUITY") =>
    accounts
      .filter((a) => a.type === type)
      .map((a) => ({ code: a.code, name: a.name, amount: netByCode.get(a.code) ?? 0 }))
      .filter((l) => l.amount !== 0);

  const assets = toLines("ASSET");
  const liabilities = toLines("LIABILITY");
  const equity = toLines("EQUITY");

  const totalAssets = round2(assets.reduce((s, l) => s + l.amount, 0));
  const totalLiabilities = round2(liabilities.reduce((s, l) => s + l.amount, 0));
  const equityBase = round2(equity.reduce((s, l) => s + l.amount, 0));

  const epoch = new Date(0);
  const pl = await getProfitAndLoss({ from: epoch, to: asOf });
  const currentEarnings = pl.netProfit;
  const totalEquity = round2(equityBase + currentEarnings);

  return {
    asOf,
    assets,
    liabilities,
    equity,
    currentEarnings,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
}

export interface CashFlowLine {
  label: string;
  amount: number;
}

export interface CashFlow {
  openingBalance: number;
  inflows: CashFlowLine[];
  totalInflows: number;
  outflows: CashFlowLine[];
  totalOutflows: number;
  closingBalance: number;
}

const CASH_FLOW_LABELS: Partial<Record<string, string>> = {
  CASH_COLLECTED: "Customer Payments Collected",
  ORDER_REFUND: "Refunds to Customers",
  EXPENSE: "Expenses Paid",
  SUPPLIER_PAYMENT: "Supplier Payments",
  MANUAL_ADJUSTMENT: "Manual Adjustments",
};

/** Cumulative net movement of the Cash & Bank account through a given instant — same technique
 * as getBalanceSheet, scoped to one account, used for both the opening-balance and the
 * closing-balance cross-check below. */
async function cashBalanceAsOf(cashAccountId: string, asOf: Date): Promise<number> {
  const sum = await db.journalLine.aggregate({
    where: { accountId: cashAccountId, entry: { date: { lte: asOf } } },
    _sum: { debit: true, credit: true },
  });
  return round2(Number(sum._sum.debit ?? 0) - Number(sum._sum.credit ?? 0));
}

/**
 * Buckets every JournalLine touching Cash & Bank within [from, to] by its JournalEntry's
 * sourceType. Debits to cash are inflows, credits are outflows — except EXPENSE, whose normal
 * flow is a credit (cash paid out) with EXPENSE_VOIDED reversals appearing as debits; both share
 * the sourceType "EXPENSE" so they net together as one "Expenses Paid" line, which is exactly
 * what a cash-flow line for expenses should show (net cash out, refund-of-expense included).
 */
export async function getCashFlow({ from, to }: AnalyticsRange): Promise<CashFlow> {
  const cashAccount = await db.ledgerAccount.findUniqueOrThrow({ where: { code: ACCOUNT_CODES.CASH_BANK } });

  const openingBalance = await cashBalanceAsOf(cashAccount.id, new Date(from.getTime() - 1));

  const lines = await db.journalLine.findMany({
    where: { accountId: cashAccount.id, entry: { date: { gte: from, lte: to } } },
    select: { debit: true, credit: true, entry: { select: { sourceType: true } } },
  });

  // Net by sourceType FIRST, then classify the resulting net as inflow or outflow — not
  // per-line — so EXPENSE and its EXPENSE_VOIDED reversal (same sourceType) net together into
  // one "Expenses Paid" line instead of appearing as separate inflow and outflow entries.
  const netByType = new Map<string, number>();
  for (const line of lines) {
    const net = Number(line.debit) - Number(line.credit);
    const type = line.entry.sourceType;
    netByType.set(type, round2((netByType.get(type) ?? 0) + net));
  }

  const inflows: CashFlowLine[] = [];
  const outflows: CashFlowLine[] = [];
  for (const [type, net] of netByType) {
    if (net > 0) inflows.push({ label: CASH_FLOW_LABELS[type] ?? type, amount: net });
    else if (net < 0) outflows.push({ label: CASH_FLOW_LABELS[type] ?? type, amount: -net });
  }
  const totalInflows = round2(inflows.reduce((s, l) => s + l.amount, 0));
  const totalOutflows = round2(outflows.reduce((s, l) => s + l.amount, 0));
  const closingBalance = round2(openingBalance + totalInflows - totalOutflows);

  return { openingBalance, inflows, totalInflows, outflows, totalOutflows, closingBalance };
}

// ---------- Product & Customer profitability ----------
//
// These two query Order/OrderItem directly, not the ledger — deliberately different from
// getProfitAndLoss above. The ledger has no per-product or per-customer dimension (a
// JournalLine only knows its account), so there is no ledger query that could answer "which
// products/customers were profitable." This mirrors getAnalytics()'s (src/lib/data/
// admin-analytics.ts) in-memory Map-over-findMany pattern for top products/categories.
//
// Filtered by `invoiceDate` (not `createdAt`) and `paymentStatus: "PAID"` — invoiceDate is set
// exactly when revenue is recognized (prepaid confirmation or COD delivery, see
// src/lib/orders/status.ts), the same moment the ledger posts, so these reports stay
// consistent with what the P&L counts for the same period.
//
// Refunds are NOT attributed back to specific product/customer lines — Refund is order-level in
// this schema, and splitting one back across order lines would require knowing which physical
// items were returned, which isn't tracked per return today. Revenue/COGS/Gross Profit here
// reflect paid order lines only; refund impact stays visible at the aggregate P&L/Cash Flow
// level. A named scope boundary, not a silent gap.

interface ProfitabilityOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  subtotal: unknown;
  costPriceSnapshot: unknown;
  order: { id: string; discountAmount: unknown; subtotal: unknown; userId: string | null; guestEmail: string | null; user: { name: string | null; email: string } | null };
}

async function paidOrderItemsInRange(from: Date, to: Date) {
  return db.orderItem.findMany({
    where: { order: { paymentStatus: "PAID", invoiceDate: { gte: from, lte: to } } },
    select: {
      productId: true,
      productName: true,
      quantity: true,
      subtotal: true,
      costPriceSnapshot: true,
      order: { select: { id: true, discountAmount: true, subtotal: true, userId: true, guestEmail: true, user: { select: { name: true, email: true } } } },
    },
  }) as Promise<ProfitabilityOrderItem[]>;
}

/** Prorates an order's total discount across its lines by each line's share of the order
 * subtotal — the same technique src/lib/cart.ts uses (discountRatio) to compute per-line tax. */
function allocatedDiscount(item: ProfitabilityOrderItem): number {
  const orderSubtotal = Number(item.order.subtotal);
  if (orderSubtotal <= 0) return 0;
  const ratio = Number(item.order.discountAmount) / orderSubtotal;
  return Number(item.subtotal) * ratio;
}

export interface ProductProfitabilityLine {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  discounts: number;
  cogs: number;
  grossProfit: number;
  marginPct: number;
}

export async function getProductProfitability({ from, to }: AnalyticsRange): Promise<ProductProfitabilityLine[]> {
  const items = await paidOrderItemsInRange(from, to);

  const byProduct = new Map<string, { name: string; units: number; grossRevenue: number; discounts: number; cogs: number }>();
  for (const item of items) {
    const entry = byProduct.get(item.productId) ?? { name: item.productName, units: 0, grossRevenue: 0, discounts: 0, cogs: 0 };
    entry.units += item.quantity;
    entry.grossRevenue += Number(item.subtotal);
    entry.discounts += allocatedDiscount(item);
    entry.cogs += item.costPriceSnapshot ? Number(item.costPriceSnapshot) * item.quantity : 0;
    byProduct.set(item.productId, entry);
  }

  return [...byProduct.entries()]
    .map(([productId, e]) => {
      const revenue = round2(e.grossRevenue - e.discounts);
      const cogs = round2(e.cogs);
      const grossProfit = round2(revenue - cogs);
      return {
        productId,
        productName: e.name,
        unitsSold: e.units,
        revenue,
        discounts: round2(e.discounts),
        cogs,
        grossProfit,
        marginPct: revenue !== 0 ? round2((grossProfit / revenue) * 100) : 0,
      };
    })
    .sort((a, b) => b.grossProfit - a.grossProfit);
}

export interface CustomerProfitabilityLine {
  key: string;
  label: string;
  orders: number;
  revenue: number;
  discounts: number;
  cogs: number;
  grossProfit: number;
  avgOrderValue: number;
}

export async function getCustomerProfitability({ from, to }: AnalyticsRange): Promise<CustomerProfitabilityLine[]> {
  const items = await paidOrderItemsInRange(from, to);

  const byCustomer = new Map<string, { label: string; orderIds: Set<string>; grossRevenue: number; discounts: number; cogs: number }>();
  for (const item of items) {
    const key = item.order.userId ?? `guest:${item.order.guestEmail ?? "unknown"}`;
    const label = item.order.user?.name ?? item.order.user?.email ?? (item.order.guestEmail ? `Guest — ${item.order.guestEmail}` : "Guest");
    const entry = byCustomer.get(key) ?? { label, orderIds: new Set<string>(), grossRevenue: 0, discounts: 0, cogs: 0 };
    entry.orderIds.add(item.order.id);
    entry.grossRevenue += Number(item.subtotal);
    entry.discounts += allocatedDiscount(item);
    entry.cogs += item.costPriceSnapshot ? Number(item.costPriceSnapshot) * item.quantity : 0;
    byCustomer.set(key, entry);
  }

  return [...byCustomer.entries()]
    .map(([key, e]) => {
      const revenue = round2(e.grossRevenue - e.discounts);
      const cogs = round2(e.cogs);
      const grossProfit = round2(revenue - cogs);
      const orders = e.orderIds.size;
      return {
        key,
        label: e.label,
        orders,
        revenue,
        discounts: round2(e.discounts),
        cogs,
        grossProfit,
        avgOrderValue: orders > 0 ? round2(revenue / orders) : 0,
      };
    })
    .sort((a, b) => b.grossProfit - a.grossProfit);
}

// ---------- Inventory valuation ----------
//
// Computed from physical stock (ProductVariant.stock * costPrice), NOT the ledger's Inventory
// Asset account. That account only reflects the two flows Phases A/B wired up (PO receiving,
// order COGS) — manual stock adjustments, transfers, and return restocks never post to it, so
// it would understate/overstate real holdings. This report is what "how much inventory do we
// have" actually means operationally.

export interface InventoryValuationWarehouseLine {
  warehouseId: string;
  warehouseName: string;
  value: number;
  units: number;
}

export interface InventoryValuation {
  totalValue: number;
  totalUnits: number;
  byWarehouse: InventoryValuationWarehouseLine[];
  uncostedVariantCount: number;
  uncostedUnits: number;
}

export async function getInventoryValuation(): Promise<InventoryValuation> {
  const stocks = await db.variantWarehouseStock.findMany({
    where: { quantity: { gt: 0 } },
    select: { quantity: true, warehouseId: true, warehouse: { select: { name: true } }, variant: { select: { costPrice: true } } },
  });

  const byWarehouse = new Map<string, { name: string; value: number; units: number }>();
  let totalValue = 0;
  let totalUnits = 0;
  let uncostedVariantCount = 0;
  let uncostedUnits = 0;
  const uncostedVariantIds = new Set<string>();

  for (const s of stocks) {
    const entry = byWarehouse.get(s.warehouseId) ?? { name: s.warehouse.name, value: 0, units: 0 };
    if (s.variant.costPrice) {
      const value = round2(Number(s.variant.costPrice) * s.quantity);
      entry.value = round2(entry.value + value);
      totalValue = round2(totalValue + value);
    } else {
      uncostedUnits += s.quantity;
    }
    entry.units += s.quantity;
    totalUnits += s.quantity;
    byWarehouse.set(s.warehouseId, entry);
  }

  // Count distinct uncosted variants separately from the per-warehouse loop above (a variant
  // split across multiple warehouses should only count once here).
  const variantsWithStock = await db.productVariant.findMany({ where: { stock: { gt: 0 }, costPrice: null }, select: { id: true } });
  for (const v of variantsWithStock) uncostedVariantIds.add(v.id);
  uncostedVariantCount = uncostedVariantIds.size;

  return {
    totalValue,
    totalUnits,
    byWarehouse: [...byWarehouse.entries()].map(([warehouseId, w]) => ({ warehouseId, warehouseName: w.name, value: w.value, units: w.units })),
    uncostedVariantCount,
    uncostedUnits,
  };
}

// ---------- Tax report ----------
//
// Sales-side only. Nothing in Phases A-C models purchase-side GST (no input-credit posting
// exists — PurchaseOrderItem has no tax field), so rather than fabricate a "Tax Paid" figure,
// this reports GST Collected/Reversed/Net Payable for the period and states plainly that
// purchase-side input credit isn't tracked yet.

export interface TaxReport {
  gstCollected: number;
  gstReversed: number;
  netGstForPeriod: number;
  gstPayableBalance: number;
  purchaseSideTrackedNote: string;
}

export async function getTaxReport({ from, to }: AnalyticsRange): Promise<TaxReport> {
  const gstAccount = await db.ledgerAccount.findUniqueOrThrow({ where: { code: ACCOUNT_CODES.GST_OUTPUT_PAYABLE } });

  const lines = await db.journalLine.findMany({
    where: { accountId: gstAccount.id, entry: { date: { gte: from, lte: to } } },
    select: { debit: true, credit: true },
  });
  const gstCollected = round2(lines.reduce((s, l) => s + Number(l.credit), 0));
  const gstReversed = round2(lines.reduce((s, l) => s + Number(l.debit), 0));

  const gstPayableBalance = await cashBalanceAsOfAccount(gstAccount.id, to, "LIABILITY");

  return {
    gstCollected,
    gstReversed,
    netGstForPeriod: round2(gstCollected - gstReversed),
    gstPayableBalance,
    purchaseSideTrackedNote: "Purchase-side GST input credit isn't tracked yet — this report covers sales-side GST collected only.",
  };
}

/** Cumulative net balance of one account through a given instant, in whichever direction is
 * "normal" for its type — generalizes cashBalanceAsOf (which is hardcoded to ASSET direction)
 * for reuse on a LIABILITY account here. */
async function cashBalanceAsOfAccount(accountId: string, asOf: Date, kind: "ASSET" | "LIABILITY"): Promise<number> {
  const sum = await db.journalLine.aggregate({
    where: { accountId, entry: { date: { lte: asOf } } },
    _sum: { debit: true, credit: true },
  });
  const debit = Number(sum._sum.debit ?? 0);
  const credit = Number(sum._sum.credit ?? 0);
  return round2(kind === "ASSET" ? debit - credit : credit - debit);
}

// ---------- AR / AP aging ----------
//
// Bucketed by `dueDate ?? issueDate` — Invoice.dueDate is never actually set anywhere in this
// app (this storefront collects payment immediately), so issueDate is the only anchor that
// exists in the data. Buckets are days-since-anchor, not "overdue" in the strict sense, since
// nothing here has real payment terms yet.

export interface AgingLine {
  invoiceId: string;
  invoiceNumber: string;
  counterpartyName: string;
  issueDate: Date;
  dueDate: Date | null;
  total: number;
  outstanding: number;
  daysSinceAnchor: number;
  bucket: "Current (0-30)" | "31-60" | "61-90" | "90+";
}

export interface AgingReport {
  lines: AgingLine[];
  totalOutstanding: number;
  byBucket: Record<string, number>;
}

function bucketFor(days: number): AgingLine["bucket"] {
  if (days <= 30) return "Current (0-30)";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

async function buildAgingReport(type: "SALES" | "PURCHASE"): Promise<AgingReport> {
  const invoices = await db.invoice.findMany({
    where: { type, status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
    include: {
      order: { select: { user: { select: { name: true } }, guestEmail: true, orderNumber: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { issueDate: "asc" },
  });

  const now = new Date();
  const lines: AgingLine[] = invoices.map((inv) => {
    const anchor = inv.dueDate ?? inv.issueDate;
    const daysSinceAnchor = Math.max(0, Math.floor((now.getTime() - anchor.getTime()) / 86_400_000));
    const counterpartyName =
      inv.type === "SALES"
        ? (inv.order?.user?.name ?? inv.order?.guestEmail ?? inv.order?.orderNumber ?? "—")
        : (inv.supplier?.name ?? "—");
    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      counterpartyName,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      total: Number(inv.total),
      outstanding: round2(Number(inv.total) - Number(inv.amountPaid)),
      daysSinceAnchor,
      bucket: bucketFor(daysSinceAnchor),
    };
  });

  const byBucket: Record<string, number> = { "Current (0-30)": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  for (const l of lines) byBucket[l.bucket] = round2(byBucket[l.bucket] + l.outstanding);

  return { lines, totalOutstanding: round2(lines.reduce((s, l) => s + l.outstanding, 0)), byBucket };
}

export async function getArAging(): Promise<AgingReport> {
  return buildAgingReport("SALES");
}

export async function getApAging(): Promise<AgingReport> {
  return buildAgingReport("PURCHASE");
}

// ---------- Supplier purchases ----------

export interface SupplierPurchaseLine {
  supplierId: string;
  supplierName: string;
  poCount: number;
  totalOrdered: number;
  totalReceived: number;
}

export async function getSupplierPurchases({ from, to }: AnalyticsRange): Promise<SupplierPurchaseLine[]> {
  const orders = await db.purchaseOrder.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { supplier: { select: { id: true, name: true } }, items: true },
  });

  const bySupplier = new Map<string, { name: string; poCount: number; ordered: number; received: number }>();
  for (const po of orders) {
    const entry = bySupplier.get(po.supplier.id) ?? { name: po.supplier.name, poCount: 0, ordered: 0, received: 0 };
    entry.poCount += 1;
    for (const item of po.items) {
      entry.ordered += Number(item.unitCost) * item.quantityOrdered;
      entry.received += Number(item.unitCost) * item.quantityReceived;
    }
    bySupplier.set(po.supplier.id, entry);
  }

  return [...bySupplier.entries()]
    .map(([supplierId, e]) => ({
      supplierId,
      supplierName: e.name,
      poCount: e.poCount,
      totalOrdered: round2(e.ordered),
      totalReceived: round2(e.received),
    }))
    .sort((a, b) => b.totalOrdered - a.totalOrdered);
}
