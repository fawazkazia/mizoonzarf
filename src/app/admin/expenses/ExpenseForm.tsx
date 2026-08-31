"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Fieldset } from "@/components/admin/FormField";
import { createExpense, updateExpense } from "./actions";
import { expenseCategoryValues, type ExpenseInput } from "@/lib/validation/admin-finance";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/finance/accounts";

export interface ExpenseFormInitial {
  id: string;
  category: string;
  description: string;
  amount: string;
  incurredAt: string;
  supplierId: string;
  paidFrom: string;
}

export function ExpenseForm({ suppliers, initial }: { suppliers: { id: string; name: string }[]; initial?: ExpenseFormInitial }) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.category ?? expenseCategoryValues[0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [incurredAt, setIncurredAt] = useState(initial?.incurredAt ?? new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState(initial?.supplierId ?? "");
  const [paidFrom, setPaidFrom] = useState(initial?.paidFrom ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial) {
        await updateExpense(initial.id, { description, incurredAt, supplierId: supplierId || null, paidFrom });
        toast.success("Expense updated.");
      } else {
        const payload: ExpenseInput = {
          category: category as ExpenseInput["category"],
          description,
          amount: Number(amount),
          incurredAt,
          supplierId: supplierId || undefined,
          paidFrom,
        };
        await createExpense(payload);
        toast.success("Expense recorded.");
      }
      router.push("/admin/expenses");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Details">
        <Field label="Category" hint={initial ? "Category can't be changed after recording — delete and re-record instead." : undefined}>
          <Select required value={category} disabled={Boolean(initial)} onChange={(e) => setCategory(e.target.value)}>
            {expenseCategoryValues.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount" hint={initial ? "Amount can't be changed after recording — delete and re-record instead." : undefined}>
          <Input required type="number" step="0.01" min={0} value={amount} disabled={Boolean(initial)} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date">
          <Input required type="date" value={incurredAt} onChange={(e) => setIncurredAt(e.target.value)} />
        </Field>
        <Field label="Supplier (optional)">
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Paid From" hint="e.g. HDFC Current A/c — free text for now">
          <Input value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Input required value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </Fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : initial ? "Save Changes" : "Record Expense"}
      </Button>
    </form>
  );
}
