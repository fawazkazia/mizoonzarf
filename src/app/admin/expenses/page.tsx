import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/currency";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/finance/accounts";
import { ExpenseRowActions } from "./ExpenseRowActions";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const expenses = await db.expense.findMany({ orderBy: { incurredAt: "desc" }, include: { supplier: { select: { name: true } } } });
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Expenses</h1>
        <ButtonLink href="/admin/expenses/new">+ Record Expense</ButtonLink>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Category</Th>
            <Th>Description</Th>
            <Th>Supplier</Th>
            <Th>Amount</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 && <EmptyRow colSpan={6}>No expenses recorded yet.</EmptyRow>}
          {expenses.map((e) => (
            <tr key={e.id}>
              <Td>{e.incurredAt.toLocaleDateString("en-IN")}</Td>
              <Td>{EXPENSE_CATEGORY_LABELS[e.category]}</Td>
              <Td>{e.description}</Td>
              <Td>{e.supplier?.name ?? "—"}</Td>
              <Td>{formatINR(Number(e.amount))}</Td>
              <Td className="text-right">
                <ExpenseRowActions id={e.id} description={e.description} />
              </Td>
            </tr>
          ))}
        </tbody>
        {expenses.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={4} className="border-b border-line px-4 py-3 text-right font-medium">
                Total
              </td>
              <td className="border-b border-line px-4 py-3 font-medium">{formatINR(total)}</td>
              <td className="border-b border-line px-4 py-3" />
            </tr>
          </tfoot>
        )}
      </Table>
    </div>
  );
}
