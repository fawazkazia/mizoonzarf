"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Fieldset } from "@/components/admin/FormField";
import { createPurchaseOrder } from "./actions";
import type { PurchaseOrderInput } from "@/lib/validation/admin-finance";

interface VariantOption {
  id: string;
  sku: string;
  label: string;
  lastCost: number | null;
}

interface LineRow {
  key: string;
  variantId: string;
  label: string;
  quantityOrdered: string;
  unitCost: string;
}

export function PurchaseOrderForm({
  suppliers,
  warehouses,
  variants,
  initialSupplierId,
}: {
  suppliers: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  variants: VariantOption[];
  initialSupplierId?: string;
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? suppliers[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [lines, setLines] = useState<LineRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const matches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return variants.filter((v) => v.sku.toLowerCase().includes(q) || v.label.toLowerCase().includes(q)).slice(0, 15);
  }, [search, variants]);

  function addLine(variant: VariantOption) {
    if (lines.some((l) => l.variantId === variant.id)) {
      toast.error("This variant is already on the order.");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: Math.random().toString(36).slice(2),
        variantId: variant.id,
        label: `${variant.label} (${variant.sku})`,
        quantityOrdered: "1",
        unitCost: variant.lastCost ? String(variant.lastCost) : "",
      },
    ]);
    setSearch("");
  }

  function updateLine(key: string, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const total = lines.reduce((sum, l) => sum + (Number(l.quantityOrdered) || 0) * (Number(l.unitCost) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Add at least one line item.");
      return;
    }
    const payload: PurchaseOrderInput = {
      supplierId,
      warehouseId,
      notes: notes || undefined,
      expectedAt: expectedAt || undefined,
      items: lines.map((l) => ({ variantId: l.variantId, quantityOrdered: Number(l.quantityOrdered), unitCost: Number(l.unitCost) })),
    };

    setLoading(true);
    try {
      const { id } = await createPurchaseOrder(payload);
      toast.success("Purchase order created.");
      router.push(`/admin/purchase-orders/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Details">
        <Field label="Supplier">
          <Select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Select a supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Receiving Warehouse">
          <Select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Expected Delivery">
          <Input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Line Items">
        <div className="relative sm:col-span-2">
          <Field label="Add Product/Variant" hint="Search by product name or SKU">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU or product..." />
          </Field>
          {matches.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto border border-line bg-paper shadow-lg">
              {matches.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => addLine(v)}
                  className="block w-full border-b border-line px-3 py-2 text-left text-sm hover:bg-paper-dim"
                >
                  {v.label} <span className="text-ink-soft">· {v.sku}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          {lines.length === 0 ? (
            <p className="text-sm text-ink-soft">No line items yet — search above to add one.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {lines.map((l) => (
                <div key={l.key} className="grid grid-cols-[1fr_100px_120px_32px] items-end gap-3 border-b border-line pb-3">
                  <p className="truncate text-sm">{l.label}</p>
                  <Field label="Qty">
                    <Input
                      type="number"
                      min={1}
                      value={l.quantityOrdered}
                      onChange={(e) => updateLine(l.key, { quantityOrdered: e.target.value })}
                    />
                  </Field>
                  <Field label="Unit Cost">
                    <Input type="number" step="0.01" min={0} value={l.unitCost} onChange={(e) => updateLine(l.key, { unitCost: e.target.value })} />
                  </Field>
                  <button type="button" onClick={() => removeLine(l.key)} className="mb-2.5 text-ink-soft hover:text-sale">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <p className="text-right text-sm font-medium">Total: ₹{total.toFixed(2)}</p>
            </div>
          )}
        </div>
      </Fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Creating..." : "Create Purchase Order"}
      </Button>
    </form>
  );
}
