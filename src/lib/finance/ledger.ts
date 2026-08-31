import type { Prisma, FinanceSourceType, Order, OrderItem } from "@/generated/prisma/client";
import { ACCOUNT_CODES } from "@/lib/finance/accounts";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

type Line = { accountCode: string; debit?: number; credit?: number; memo?: string };

/** Race-safe global sequence, same upsert pattern as generateInvoiceNumber (src/lib/orders/invoicing.ts). */
async function nextEntryNumber(tx: Prisma.TransactionClient): Promise<string> {
  const counter = await tx.journalEntryCounter.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `JE-${String(counter.lastNumber).padStart(8, "0")}`;
}

/**
 * Core double-entry poster. Throws if debits != credits — this is the primary balance guard,
 * checked before any row is written. `sourceType`+`sourceId`+`kind` double as the idempotency
 * key via the JournalEntry unique constraint: calling this twice for the same event throws a
 * unique-violation on the second call rather than silently double-posting.
 */
export async function postJournalEntry(
  tx: Prisma.TransactionClient,
  params: {
    sourceType: FinanceSourceType;
    sourceId: string;
    kind: string;
    date: Date;
    description: string;
    lines: Line[];
    createdById?: string | null;
  }
) {
  const nonZeroLines = params.lines.filter((l) => (l.debit ?? 0) !== 0 || (l.credit ?? 0) !== 0);
  const debitTotal = round2(nonZeroLines.reduce((sum, l) => sum + (l.debit ?? 0), 0));
  const creditTotal = round2(nonZeroLines.reduce((sum, l) => sum + (l.credit ?? 0), 0));
  if (debitTotal !== creditTotal) {
    throw new Error(
      `Journal entry not balanced for ${params.kind}/${params.sourceId}: debits ${debitTotal} != credits ${creditTotal}`
    );
  }
  if (nonZeroLines.length === 0) {
    throw new Error(`Journal entry for ${params.kind}/${params.sourceId} has no non-zero lines to post.`);
  }

  const codes = [...new Set(nonZeroLines.map((l) => l.accountCode))];
  const accounts = await tx.ledgerAccount.findMany({ where: { code: { in: codes } } });
  const accountByCode = new Map(accounts.map((a) => [a.code, a]));
  for (const code of codes) {
    if (!accountByCode.has(code)) {
      throw new Error(`Chart of accounts is missing account ${code} — cannot post ${params.kind}/${params.sourceId}.`);
    }
  }

  const entryNumber = await nextEntryNumber(tx);
  return tx.journalEntry.create({
    data: {
      entryNumber,
      date: params.date,
      description: params.description,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      kind: params.kind,
      createdById: params.createdById ?? undefined,
      lines: {
        create: nonZeroLines.map((l) => ({
          accountId: accountByCode.get(l.accountCode)!.id,
          debit: l.debit ?? 0,
          credit: l.credit ?? 0,
          memo: l.memo,
        })),
      },
    },
    include: { lines: true },
  });
}

/**
 * Posts the revenue+tax+COGS entry for a newly-paid order. Net Sales Revenue is derived as
 * `subtotal + shippingFee - (taxInclusive ? taxAmount : 0)` — when prices are tax-inclusive
 * (the site's default, see SiteSettings.taxInclusive), the stored `subtotal` already contains
 * the GST portion, so it must be backed out of revenue and routed to GST Output Payable
 * instead; when exclusive, `subtotal` is already tax-free and taxAmount is purely additive.
 * This is the one formula that keeps the entry balanced under either setting without the
 * caller needing to know which mode is active.
 */
export async function postOrderPaidEntry(
  tx: Prisma.TransactionClient,
  params: { order: Order; items: OrderItem[]; taxInclusive: boolean; createdById?: string | null }
) {
  const { order, items, taxInclusive } = params;
  const subtotal = Number(order.subtotal);
  const discountAmount = Number(order.discountAmount);
  const shippingFee = Number(order.shippingFee);
  const taxAmount = Number(order.taxAmount);
  const total = Number(order.total);

  const netSalesRevenue = round2(subtotal + shippingFee - (taxInclusive ? taxAmount : 0));
  const cogsTotal = round2(
    items.reduce((sum, item) => sum + (item.costPriceSnapshot ? Number(item.costPriceSnapshot) * item.quantity : 0), 0)
  );

  const lines: Line[] = [
    { accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, debit: total, memo: `Order ${order.orderNumber}` },
    { accountCode: ACCOUNT_CODES.SALES_REVENUE, credit: netSalesRevenue },
    { accountCode: ACCOUNT_CODES.GST_OUTPUT_PAYABLE, credit: taxAmount },
  ];
  if (discountAmount > 0) lines.push({ accountCode: ACCOUNT_CODES.SALES_DISCOUNTS, debit: discountAmount });
  if (cogsTotal > 0) {
    lines.push({ accountCode: ACCOUNT_CODES.COGS, debit: cogsTotal, memo: "COGS" });
    lines.push({ accountCode: ACCOUNT_CODES.INVENTORY_ASSET, credit: cogsTotal, memo: "COGS" });
  }

  return postJournalEntry(tx, {
    sourceType: "ORDER_PAYMENT",
    sourceId: order.id,
    kind: "ORDER_PAID",
    date: new Date(),
    description: `Order ${order.orderNumber} paid`,
    lines,
    createdById: params.createdById,
  });
}

/**
 * Reversing entry for a refund. Revenue/GST/discount reversal is scaled by
 * `refundAmount / order.total` — an approximation for partial refunds that doesn't attempt
 * per-line-item precision (that would require knowing exactly which items were refunded and
 * at what tax rate each). COGS/Inventory reversal, when provided, is exact — it comes from the
 * caller looking up the actual OrderItem.costPriceSnapshot for the restocked variant.
 */
export async function postOrderRefundEntry(
  tx: Prisma.TransactionClient,
  params: {
    order: Order;
    /** The Refund row's own id — used as sourceId (not order.id) so a second partial refund on
     * the same order gets its own JournalEntry instead of colliding on the (sourceType,
     * sourceId, kind) unique constraint that guards against double-posting. */
    refundId: string;
    refundAmount: number;
    taxInclusive: boolean;
    cogsReversalAmount?: number;
    createdById?: string | null;
  }
) {
  const { order, refundAmount, taxInclusive } = params;
  const total = Number(order.total);
  const fraction = total > 0 ? Math.min(refundAmount / total, 1) : 1;

  const subtotal = Number(order.subtotal);
  const shippingFee = Number(order.shippingFee);
  const taxAmount = Number(order.taxAmount);
  const discountAmount = Number(order.discountAmount);

  const netSalesRevenue = subtotal + shippingFee - (taxInclusive ? taxAmount : 0);
  const revenueReversal = round2(netSalesRevenue * fraction);
  const discountReversal = round2(discountAmount * fraction);
  const creditSide = round2(refundAmount) + discountReversal;
  // GST reversal is a balancing plug, not an independent `round2(taxAmount * fraction)` —
  // independently rounding all three components (revenue/GST/discount) to 2dp can leave the
  // entry off by a cent for arbitrary partial-refund amounts (sum-of-rounded-parts != rounded-
  // sum). Deriving the smallest, least-visible line from the other two guarantees debits equal
  // credits exactly, at the cost of a possible ±0.01 wobble in the GST figure specifically —
  // the standard "plug the least material line" technique, not a rounding error of its own.
  const gstReversal = round2(creditSide - revenueReversal);

  const lines: Line[] = [
    // Debited to the Sales Returns contra-revenue account (not Sales Revenue directly) so the
    // P&L can show Gross Sales, Discounts, and Returns as separate lines per the spec's layout.
    { accountCode: ACCOUNT_CODES.SALES_RETURNS, debit: revenueReversal, memo: `Refund: order ${order.orderNumber}` },
    { accountCode: ACCOUNT_CODES.GST_OUTPUT_PAYABLE, debit: gstReversal },
    // Credited to Cash & Bank, not Accounts Receivable: processRefund() only reaches a real
    // reversal once a Payment row is already PAID, which (since postCashCollectedEntry runs
    // immediately after every order-paid event) only happens after cash has already been
    // collected — AR holds nothing for this order by then.
    { accountCode: ACCOUNT_CODES.CASH_BANK, credit: round2(refundAmount) },
  ];
  if (discountReversal > 0) lines.push({ accountCode: ACCOUNT_CODES.SALES_DISCOUNTS, credit: discountReversal });
  if (params.cogsReversalAmount && params.cogsReversalAmount > 0) {
    lines.push({ accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: round2(params.cogsReversalAmount), memo: "Restock" });
    lines.push({ accountCode: ACCOUNT_CODES.COGS, credit: round2(params.cogsReversalAmount), memo: "Restock" });
  }

  return postJournalEntry(tx, {
    sourceType: "ORDER_REFUND",
    sourceId: params.refundId,
    kind: "ORDER_REFUND",
    date: new Date(),
    description: `Order ${order.orderNumber} refunded`,
    lines,
    createdById: params.createdById,
  });
}

/** Posted synchronously, inside the same transaction as the stock movement — see PO receiving action. */
export async function postPOReceivedEntry(
  tx: Prisma.TransactionClient,
  params: { purchaseOrderId: string; poNumber: string; amount: number; createdById?: string | null }
) {
  return postJournalEntry(tx, {
    sourceType: "PURCHASE_ORDER_RECEIPT",
    sourceId: params.purchaseOrderId,
    kind: `RECEIPT-${Date.now()}`,
    date: new Date(),
    description: `PO ${params.poNumber} goods received`,
    lines: [
      { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: round2(params.amount) },
      { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, credit: round2(params.amount) },
    ],
    createdById: params.createdById,
  });
}

/** Posted synchronously, inside the same transaction as the Expense row — see expenses/actions.ts. */
export async function postExpenseEntry(
  tx: Prisma.TransactionClient,
  params: { expenseId: string; expenseAccountCode: string; amount: number; description: string; createdById?: string | null }
) {
  return postJournalEntry(tx, {
    sourceType: "EXPENSE",
    sourceId: params.expenseId,
    kind: "EXPENSE_RECORDED",
    date: new Date(),
    description: params.description,
    lines: [
      { accountCode: params.expenseAccountCode, debit: round2(params.amount) },
      { accountCode: ACCOUNT_CODES.CASH_BANK, credit: round2(params.amount) },
    ],
    createdById: params.createdById,
  });
}

/**
 * Posted immediately after postOrderPaidEntry, for both payment paths (prepaid at gateway
 * confirmation; COD at delivery — see applyOrderStatus). postOrderPaidEntry books revenue
 * against Accounts Receivable, not cash; this codebase doesn't model gateway-settlement lag
 * (an explicit, already-deferred simplification), so cash is treated as collected at the same
 * moment revenue is recognized for both payment types. Net effect: AR is briefly touched and
 * always nets back to ~0 — accurate, since this storefront extends no credit terms to customers.
 */
export async function postCashCollectedEntry(
  tx: Prisma.TransactionClient,
  params: { order: Order; amount: number; createdById?: string | null }
) {
  return postJournalEntry(tx, {
    sourceType: "CASH_COLLECTED",
    sourceId: params.order.id,
    kind: "CASH_COLLECTED",
    date: new Date(),
    description: `Cash collected for order ${params.order.orderNumber}`,
    lines: [
      { accountCode: ACCOUNT_CODES.CASH_BANK, debit: round2(params.amount) },
      { accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, credit: round2(params.amount) },
    ],
    createdById: params.createdById,
  });
}

/**
 * Posted inside the same transaction as the Invoice(PURCHASE) update — staff-driven, no
 * customer-facing latency concern, so a misconfigured chart of accounts blocks the save with a
 * clear error rather than silently leaving a payment unposted. `kind` is per-payment-event
 * (not a fixed constant) since one invoice can be paid in multiple installments, each needing
 * its own JournalEntry rather than colliding on the (sourceType, sourceId, kind) uniqueness.
 */
export async function postSupplierPaymentEntry(
  tx: Prisma.TransactionClient,
  params: { invoiceId: string; invoiceNumber: string; amount: number; createdById?: string | null }
) {
  return postJournalEntry(tx, {
    sourceType: "SUPPLIER_PAYMENT",
    sourceId: params.invoiceId,
    kind: `PAYMENT-${Date.now()}`,
    date: new Date(),
    description: `Payment against ${params.invoiceNumber}`,
    lines: [
      { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: round2(params.amount) },
      { accountCode: ACCOUNT_CODES.CASH_BANK, credit: round2(params.amount) },
    ],
    createdById: params.createdById,
  });
}

/** Reverses a previously-posted expense entry — debit/credit sides swapped relative to
 * postExpenseEntry (not a negative-amount version of it, which would produce negative debit/
 * credit figures on the JournalLine rows). Used by deleteExpense's void-before-delete flow. */
export async function postExpenseReversalEntry(
  tx: Prisma.TransactionClient,
  params: { expenseId: string; expenseAccountCode: string; amount: number; description: string; createdById?: string | null }
) {
  return postJournalEntry(tx, {
    sourceType: "EXPENSE",
    sourceId: params.expenseId,
    kind: "EXPENSE_VOIDED",
    date: new Date(),
    description: params.description,
    lines: [
      { accountCode: ACCOUNT_CODES.CASH_BANK, debit: round2(params.amount) },
      { accountCode: params.expenseAccountCode, credit: round2(params.amount) },
    ],
    createdById: params.createdById,
  });
}
