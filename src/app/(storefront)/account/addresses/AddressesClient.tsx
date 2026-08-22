"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

const EMPTY_FORM = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", country: "AE", postalCode: "" };

export function AddressesClient({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data.addresses);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't save this address.");
      return;
    }
    toast.success("Address saved.");
    setForm(EMPTY_FORM);
    setShowForm(false);
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
            <div className="flex items-start justify-between">
              <p className="font-medium">{a.fullName}</p>
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
              <button onClick={() => handleDelete(a.id)} className="flex items-center gap-1 text-xs text-sale">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleAdd} className="mt-6 grid gap-3 border border-line p-6 sm:grid-cols-2">
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
          <input required placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
          <input required placeholder="Street address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
          <input placeholder="Apartment (optional)" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="border border-line px-4 py-3 text-sm sm:col-span-2" />
          <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-line px-4 py-3 text-sm" />
          <input placeholder="Emirate / State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border border-line px-4 py-3 text-sm" />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              Save Address
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="mt-6" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add New Address
        </Button>
      )}
    </div>
  );
}
