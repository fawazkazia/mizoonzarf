"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/admin/FormField";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { createPromotion, togglePromotion, deletePromotion } from "./actions";
import type { PromotionInput } from "@/lib/validation/admin-promotion";

export interface PromotionRow {
  id: string;
  name: string;
  type: string;
  discountType: string;
  discountValue: number;
  categorySlugs: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

function emptyForm(): PromotionInput {
  return {
    name: "",
    type: "FLASH_SALE",
    discountType: "PERCENTAGE",
    discountValue: 20,
    categorySlugs: [],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10),
    isActive: true,
    bannerText: "",
  };
}

export function PromotionManager({ promotions, categoryOptions }: { promotions: PromotionRow[]; categoryOptions: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState<PromotionInput>(emptyForm());
  const [loading, setLoading] = useState(false);

  function toggleCategory(slug: string) {
    setForm((f) => ({
      ...f,
      categorySlugs: f.categorySlugs.includes(slug) ? f.categorySlugs.filter((s) => s !== slug) : [...f.categorySlugs, slug],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createPromotion(form);
      toast.success("Promotion created.");
      setForm(emptyForm());
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create promotion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await togglePromotion(id, !isActive);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promotion?")) return;
    await deletePromotion(id);
    toast.success("Promotion deleted.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="grid gap-3 border border-line p-5 sm:grid-cols-3">
        <Field label="Name">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PromotionInput["type"] })}>
            <option value="FLASH_SALE">Flash Sale</option>
            <option value="CATEGORY_SALE">Category Sale</option>
            <option value="PRODUCT_SALE">Product Sale</option>
            <option value="SEASONAL">Seasonal</option>
          </Select>
        </Field>
        <Field label="Discount Type">
          <Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as PromotionInput["discountType"] })}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </Select>
        </Field>
        <Field label="Discount Value">
          <Input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
        </Field>
        <Field label="Start Date">
          <Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </Field>
        <Field label="End Date">
          <Input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </Field>
        <div className="sm:col-span-3">
          <Field label="Banner Text (optional)">
            <Input value={form.bannerText} onChange={(e) => setForm({ ...form, bannerText: e.target.value })} placeholder="Limited Time Offer" />
          </Field>
        </div>
        <div className="sm:col-span-3">
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-ink-soft">Applies to Categories (leave empty for all)</p>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleCategory(c.slug)}
                className={`border px-3 py-1.5 text-xs ${form.categorySlugs.includes(c.slug) ? "border-ink bg-ink text-paper" : "border-line"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={loading} className="self-start sm:col-span-3">
          Create Promotion
        </Button>
      </form>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Discount</Th>
            <Th>Valid Until</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {promotions.length === 0 && <EmptyRow colSpan={6}>No promotions yet.</EmptyRow>}
          {promotions.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.name}</Td>
              <Td>{p.type.replace(/_/g, " ")}</Td>
              <Td>
                {p.discountType === "PERCENTAGE" && `${p.discountValue}%`}
                {p.discountType === "FIXED" && `AED ${p.discountValue}`}
                {p.discountType === "FREE_SHIPPING" && "Free Shipping"}
              </Td>
              <Td>{new Date(p.endDate).toLocaleDateString()}</Td>
              <Td>
                <button onClick={() => handleToggle(p.id, p.isActive)}>
                  <Badge tone={p.isActive ? "success" : "outline"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                </button>
              </Td>
              <Td className="text-right">
                <button onClick={() => handleDelete(p.id)} className="text-ink-soft hover:text-sale">
                  <Trash2 size={15} />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
