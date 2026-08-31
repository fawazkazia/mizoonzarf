import type { AccountType, ExpenseCategory } from "@/generated/prisma/client";

/** Ledger account codes referenced by name from posting code — never hardcode a bare string elsewhere. */
export const ACCOUNT_CODES = {
  CASH_BANK: "1000",
  ACCOUNTS_RECEIVABLE: "1100",
  INVENTORY_ASSET: "1200",
  GST_INPUT_CREDIT: "1300",
  ACCOUNTS_PAYABLE: "2000",
  GST_OUTPUT_PAYABLE: "2100",
  RETAINED_EARNINGS: "3000",
  SALES_REVENUE: "4000",
  SALES_DISCOUNTS: "4100",
  SALES_RETURNS: "4200",
  COGS: "5000",
} as const;

/** One expense GL account per ExpenseCategory enum value — kept mechanically in sync with the
 * enum here rather than as a manually-maintained chart-of-accounts entry. Adding a new category
 * later is one line in both this map and the enum, not a chart-of-accounts edit. */
export const EXPENSE_CATEGORY_ACCOUNT_CODES: Record<ExpenseCategory, string> = {
  RENT: "6010",
  SALARIES: "6020",
  MARKETING: "6030",
  UTILITIES: "6040",
  SOFTWARE_SUBSCRIPTIONS: "6050",
  SHIPPING_LOGISTICS: "6060",
  BANK_FEES: "6070",
  OFFICE_SUPPLIES: "6080",
  PROFESSIONAL_FEES: "6090",
  OTHER: "6100",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  SALARIES: "Salaries",
  MARKETING: "Marketing",
  UTILITIES: "Utilities",
  SOFTWARE_SUBSCRIPTIONS: "Software & Subscriptions",
  SHIPPING_LOGISTICS: "Shipping & Logistics",
  BANK_FEES: "Bank Fees",
  OFFICE_SUPPLIES: "Office Supplies",
  PROFESSIONAL_FEES: "Professional Fees",
  OTHER: "Other",
};

export type DefaultAccount = { code: string; name: string; type: AccountType; isContra?: boolean };

/** Seeded idempotently (upsert by code) in prisma/seed.ts — see DEFAULT_CHART_OF_ACCOUNTS usage there. */
export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  { code: ACCOUNT_CODES.CASH_BANK, name: "Cash & Bank", type: "ASSET" },
  { code: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, name: "Accounts Receivable", type: "ASSET" },
  { code: ACCOUNT_CODES.INVENTORY_ASSET, name: "Inventory Asset", type: "ASSET" },
  { code: ACCOUNT_CODES.GST_INPUT_CREDIT, name: "GST Input Credit", type: "ASSET" },
  { code: ACCOUNT_CODES.ACCOUNTS_PAYABLE, name: "Accounts Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.GST_OUTPUT_PAYABLE, name: "GST Output Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.RETAINED_EARNINGS, name: "Retained Earnings", type: "EQUITY" },
  { code: ACCOUNT_CODES.SALES_REVENUE, name: "Sales Revenue", type: "REVENUE" },
  { code: ACCOUNT_CODES.SALES_DISCOUNTS, name: "Sales Discounts", type: "REVENUE", isContra: true },
  { code: ACCOUNT_CODES.SALES_RETURNS, name: "Sales Returns & Allowances", type: "REVENUE", isContra: true },
  { code: ACCOUNT_CODES.COGS, name: "Cost of Goods Sold", type: "COGS" },
  ...(Object.keys(EXPENSE_CATEGORY_ACCOUNT_CODES) as ExpenseCategory[]).map((category) => ({
    code: EXPENSE_CATEGORY_ACCOUNT_CODES[category],
    name: EXPENSE_CATEGORY_LABELS[category],
    type: "EXPENSE" as const,
  })),
];
