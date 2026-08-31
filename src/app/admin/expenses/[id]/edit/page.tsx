import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ExpenseForm } from "../../ExpenseForm";

export const metadata = { title: "Edit Expense" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [expense, suppliers] = await Promise.all([
    db.expense.findUnique({ where: { id } }),
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!expense) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Edit Expense</h1>
      <ExpenseForm
        suppliers={suppliers}
        initial={{
          id: expense.id,
          category: expense.category,
          description: expense.description,
          amount: String(expense.amount),
          incurredAt: expense.incurredAt.toISOString().slice(0, 10),
          supplierId: expense.supplierId ?? "",
          paidFrom: expense.paidFrom ?? "",
        }}
      />
    </div>
  );
}
