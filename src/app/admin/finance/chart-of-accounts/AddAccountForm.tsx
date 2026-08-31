"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Checkbox, Fieldset } from "@/components/admin/FormField";
import { createLedgerAccount } from "./actions";

export function AddAccountForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [isContra, setIsContra] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createLedgerAccount({ code, name, type: type as never, isContra, isActive: true });
      toast.success("Account added.");
      setCode("");
      setName("");
      setIsContra(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Fieldset title="Add Account">
        <Field label="Code" hint="e.g. 6110">
          <Input required value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="COGS">Cost of Goods Sold</option>
            <option value="EXPENSE">Expense</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox
            label="Contra account (reduces its type's total, e.g. Sales Discounts)"
            checked={isContra}
            onChange={(e) => setIsContra(e.target.checked)}
          />
        </div>
      </Fieldset>
      <Button type="submit" size="sm" disabled={loading} className="mt-4">
        {loading ? "Adding..." : "Add Account"}
      </Button>
    </form>
  );
}
