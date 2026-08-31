import { db } from "@/lib/db";
import { ExpenseForm } from "../ExpenseForm";

export const metadata = { title: "Record Expense" };

export default async function NewExpensePage() {
  const suppliers = await db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Record Expense</h1>
      <ExpenseForm suppliers={suppliers} />
    </div>
  );
}
