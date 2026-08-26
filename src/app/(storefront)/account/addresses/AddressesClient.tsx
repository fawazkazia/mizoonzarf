"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AddressForm } from "@/components/checkout/AddressForm";
import { AddressLabelPicker } from "@/components/checkout/AddressLabelPicker";
import {
  EMPTY_ADDRESS_FORM,
  fromSavedAddress,
  toSubmitAddress,
  validateAddress,
  focusFirstInvalidField,
  type AddressFormValue,
} from "@/lib/validation/address-client";

interface Address {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
}

type FormMode = { kind: "closed" } | { kind: "add" } | { kind: "edit"; id: string };

export function AddressesClient({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [mode, setMode] = useState<FormMode>({ kind: "closed" });
  const [formValue, setFormValue] = useState<AddressFormValue>(EMPTY_ADDRESS_FORM);
  const [label, setLabel] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data.addresses);
  }

  function openAdd() {
    setMode({ kind: "add" });
    setFormValue(EMPTY_ADDRESS_FORM);
    setLabel("");
    setErrors({});
  }

  function openEdit(a: Address) {
    setMode({ kind: "edit", id: a.id });
    setFormValue(fromSavedAddress(a));
    setLabel(a.label ?? "");
    setErrors({});
  }

  function closeForm() {
    setMode({ kind: "closed" });
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validateAddress(formValue);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirstInvalidField(fieldErrors);
      return;
    }

    setLoading(true);
    const payload = { ...toSubmitAddress(formValue), label: label || undefined };
    const res =
      mode.kind === "edit"
        ? await fetch("/api/addresses", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: mode.id, ...payload }),
          })
        : await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't save this address.");
      return;
    }
    toast.success("Address saved.");
    closeForm();
    await refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
    await refresh();
  }

  async function handleSetDefault(id: string) {
    await fetch("/api/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    await refresh();
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="border border-line p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="font-medium">{a.fullName}</p>
                {a.label && (
                  <Badge tone="outline" className="normal-case">
                    {a.label}
                  </Badge>
                )}
              </div>
              {a.isDefault && <span className="text-[10px] uppercase tracking-wide text-gold">Default</span>}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {a.line1}
              {a.line2 && `, ${a.line2}`}
              <br />
              {a.city}, {a.country}
              <br />
              {a.phone}
            </p>
            <div className="mt-3 flex gap-4">
              {!a.isDefault && (
                <button onClick={() => handleSetDefault(a.id)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink">
                  <Star size={13} /> Set Default
                </button>
              )}
              <button onClick={() => openEdit(a)} className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => handleDelete(a.id)} className="flex items-center gap-1 text-xs text-sale">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {mode.kind !== "closed" ? (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 border border-line p-6">
          <AddressForm value={formValue} onChange={(patch) => setFormValue((prev) => ({ ...prev, ...patch }))} errors={errors} />
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Label (optional)</p>
            <AddressLabelPicker value={label} onChange={setLabel} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Address"}
            </Button>
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="mt-6" onClick={openAdd}>
          <Plus size={14} /> Add New Address
        </Button>
      )}
    </div>
  );
}
