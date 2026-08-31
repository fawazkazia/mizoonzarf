import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { FINANCE_ROLES } from "@/lib/admin-permissions";
import {
  getProfitAndLoss,
  getProductProfitability,
  getCustomerProfitability,
  getTaxReport,
  getSupplierPurchases,
} from "@/lib/finance/reports";

function csvEscape(value: unknown): string {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(",");
}

async function buildProfitLossCsv(from: Date, to: Date): Promise<string> {
  const pl = await getProfitAndLoss({ from, to });
  const rows: string[] = [csvRow(["Line", "Amount"])];
  rows.push(csvRow(["Gross Sales", pl.grossSales]));
  rows.push(csvRow(["Discounts", -pl.discounts]));
  rows.push(csvRow(["Returns & Refunds", -pl.returns]));
  rows.push(csvRow(["Net Revenue", pl.netRevenue]));
  rows.push(csvRow(["Cost of Goods Sold", -pl.cogs]));
  rows.push(csvRow(["Gross Profit", pl.grossProfit]));
  for (const e of pl.expensesByCategory) rows.push(csvRow([e.category, -e.amount]));
  rows.push(csvRow(["Operating Expenses", -pl.operatingExpenses]));
  rows.push(csvRow(["Net Profit", pl.netProfit]));
  return rows.join("\n");
}

async function buildProductProfitabilityCsv(from: Date, to: Date): Promise<string> {
  const rows = await getProductProfitability({ from, to });
  const lines = [csvRow(["Product", "Units Sold", "Revenue", "Discounts", "COGS", "Gross Profit", "Margin %"])];
  for (const r of rows) lines.push(csvRow([r.productName, r.unitsSold, r.revenue, r.discounts, r.cogs, r.grossProfit, r.marginPct]));
  return lines.join("\n");
}

async function buildCustomerProfitabilityCsv(from: Date, to: Date): Promise<string> {
  const rows = await getCustomerProfitability({ from, to });
  const lines = [csvRow(["Customer", "Orders", "Revenue", "Discounts", "COGS", "Gross Profit", "Avg Order Value"])];
  for (const r of rows) lines.push(csvRow([r.label, r.orders, r.revenue, r.discounts, r.cogs, r.grossProfit, r.avgOrderValue]));
  return lines.join("\n");
}

async function buildTaxCsv(from: Date, to: Date): Promise<string> {
  const tax = await getTaxReport({ from, to });
  const lines = [csvRow(["Line", "Amount"])];
  lines.push(csvRow(["GST Collected", tax.gstCollected]));
  lines.push(csvRow(["GST Reversed", tax.gstReversed]));
  lines.push(csvRow(["Net GST for Period", tax.netGstForPeriod]));
  lines.push(csvRow(["GST Payable Balance", tax.gstPayableBalance]));
  return lines.join("\n");
}

async function buildSupplierPurchasesCsv(from: Date, to: Date): Promise<string> {
  const rows = await getSupplierPurchases({ from, to });
  const lines = [csvRow(["Supplier", "Purchase Orders", "Total Ordered", "Total Received"])];
  for (const r of rows) lines.push(csvRow([r.supplierName, r.poCount, r.totalOrdered, r.totalReceived]));
  return lines.join("\n");
}

const BUILDERS: Record<string, (from: Date, to: Date) => Promise<string>> = {
  "profit-loss": buildProfitLossCsv,
  "product-profitability": buildProductProfitabilityCsv,
  "customer-profitability": buildCustomerProfitabilityCsv,
  tax: buildTaxCsv,
  "supplier-purchases": buildSupplierPurchasesCsv,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !FINANCE_ROLES.includes(session.user.role as never)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "profit-loss";
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Missing from/to date range." }, { status: 400 });
  }

  const builder = BUILDERS[type];
  if (!builder) {
    return NextResponse.json({ error: `Unknown report type "${type}".` }, { status: 400 });
  }

  const csv = await builder(new Date(from), new Date(to));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
