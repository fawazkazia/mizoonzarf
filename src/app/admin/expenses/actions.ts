"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { FINANCE_ROLES } from "@/lib/admin-permissions";
import { expenseInputSchema, type ExpenseInput } from "@/lib/validation/admin-finance";
import { EXPENSE_CATEGORY_ACCOUNT_CODES } from "@/lib/finance/accounts";
import { postExpenseEntry, postExpenseReversalEntry } from "@/lib/finance/ledger";

function revalidateExpensePaths() {
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
}

/**
 * Amount/category are immutable once created — see updateExpense's doc comment for why. Posts
 * the ledger entry inside the same transaction as the Expense row (staff-driven, no
 * customer-facing latency concern), so a misconfigured chart of accounts blocks the save with a
 * clear error rather than silently leaving an unposted expense.
 */
export async function createExpense(raw: ExpenseInput) {
  const session = await requireRole(FINANCE_ROLES);
  const input = expenseInputSchema.parse(raw);

  const expense = await db.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        category: input.category,
        description: input.description,
        amount: input.amount,
        incurredAt: new Date(input.incurredAt),
        supplierId: input.supplierId || null,
        paidFrom: input.paidFrom || null,
        createdById: session.user.id,
      },
    });
    await postExpenseEntry(tx, {
      expenseId: created.id,
      expenseAccountCode: EXPENSE_CATEGORY_ACCOUNT_CODES[input.category],
      amount: input.amount,
      description: `${input.description} (${created.category})`,
      createdById: session.user.id,
    });
    return created;
  });

  revalidateExpensePaths();
  return { id: expense.id };
}

/**
 * Amount and category are intentionally NOT editable here — they're the two fields that drive
 * the already-posted JournalEntry, and double-entry bookkeeping norms are to post a correction,
 * never mutate a posted entry in place. To fix an amount/category mistake, delete this expense
 * (which posts a reversing entry — see deleteExpense) and record a new one.
 */
export async function updateExpense(id: string, data: { description: string; incurredAt: string; supplierId?: string | null; paidFrom?: string }) {
  await requireRole(FINANCE_ROLES);
  await db.expense.update({
    where: { id },
    data: {
      description: data.description,
      incurredAt: new Date(data.incurredAt),
      supplierId: data.supplierId || null,
      paidFrom: data.paidFrom || null,
    },
  });
  revalidateExpensePaths();
  return { id };
}

/** Posts a reversing entry before deleting — the JournalEntry rows (original + reversal) are
 * never removed, so the ledger's financial history survives even though the operational
 * Expense record is gone (matches "don't erase financial history without a reversal"). */
export async function deleteExpense(id: string) {
  const session = await requireRole(FINANCE_ROLES);
  const expense = await db.expense.findUniqueOrThrow({ where: { id } });

  await db.$transaction(async (tx) => {
    await postExpenseReversalEntry(tx, {
      expenseId: expense.id,
      expenseAccountCode: EXPENSE_CATEGORY_ACCOUNT_CODES[expense.category],
      amount: Number(expense.amount),
      description: `Void: ${expense.description}`,
      createdById: session.user.id,
    });
    await tx.expense.delete({ where: { id } });
  });

  revalidateExpensePaths();
}
