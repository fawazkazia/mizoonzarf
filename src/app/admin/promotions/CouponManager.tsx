"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/admin/FormField";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { createCoupon, toggleCoupon, deleteCoupon } from "./actions";
import type { CouponInput } from "@/lib/validation/admin-promotion";
import { formatINR } from "@/lib/currency";

export interface CouponRow {
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  usageCount: number;
  usageLimit: number | null;
  categorySlugs: string[];
  productIds: string[];
  customerIds: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

function emptyForm(): CouponInput {
  return {
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    categorySlugs: [],
    productSkus: [],
    customerEmails: [],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
    isActive: true,
  };
}

export function CouponManager({ coupons, categoryOptions }: { coupons: CouponRow[]; categoryOptions: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CouponInput>(emptyForm());
  const [skusText, setSkusText] = useState("");
  const [emailsText, setEmailsText] = useState("");
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
      await createCoupon({
        ...form,
        productSkus: skusText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
        customerEmails: emailsText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Coupon created.");
      setForm(emptyForm());
      setSkusText("");
      setEmailsText("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create coupon.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(code: string, isActive: boolean) {
    await toggleCoupon(code, !isActive);
    router.refresh();
  }

  async function handleDelete(code: string) {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    await deleteCoupon(code);
    toast.success("Coupon deleted.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="grid gap-3 border border-line p-5 sm:grid-cols-3">
        <Field label="Code">
          <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Discount Type">
          <Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponInput["discountType"] })}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </Select>
        </Field>
        <Field label="Discount Value">
          <Input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
        </Field>
        <Field label="Min Order Value (optional)">
          <Input type="number" value={form.minOrderValue ?? ""} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value ? Number(e.target.value) : undefined })} />
        </Field>
        <Field label="Start Date">
          <Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </Field>
        <Field label="End Date">
          <Input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </Field>
        <div className="sm:col-span-3">
          <Field label="Description (optional)">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-3">
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-ink-soft">Restrict to Categories (leave empty for all)</p>
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
        <Field label="Restrict to Product SKUs (comma-separated, optional)">
          <Textarea rows={2} value={skusText} onChange={(e) => setSkusText(e.target.value)} placeholder="SKU-001, SKU-002" />
        </Field>
        <Field label="Restrict to Customer Emails (comma-separated, optional)">
          <Textarea rows={2} value={emailsText} onChange={(e) => setEmailsText(e.target.value)} placeholder="customer@example.com" />
        </Field>
        <Button type="submit" disabled={loading} className="self-start sm:col-span-3">
          Create Coupon
        </Button>
      </form>

      <Table>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Discount</Th>
            <Th>Usage</Th>
            <Th>Valid Until</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {coupons.length === 0 && <EmptyRow colSpan={6}>No coupons yet.</EmptyRow>}
          {coupons.map((c) => (
            <tr key={c.code}>
              <Td className="font-medium">
                {c.code}
                {(c.categorySlugs.length > 0 || c.productIds.length > 0 || c.customerIds.length > 0) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.categorySlugs.length > 0 && <Badge tone="outline">{c.categorySlugs.length} categor{c.categorySlugs.length === 1 ? "y" : "ies"}</Badge>}
                    {c.productIds.length > 0 && <Badge tone="outline">{c.productIds.length} product{c.productIds.length === 1 ? "" : "s"}</Badge>}
                    {c.customerIds.length > 0 && <Badge tone="outline">{c.customerIds.length} customer{c.customerIds.length === 1 ? "" : "s"}</Badge>}
                  </div>
                )}
              </Td>
              <Td>
                {c.discountType === "PERCENTAGE" && `${c.discountValue}%`}
                {c.discountType === "FIXED" && formatINR(c.discountValue)}
                {c.discountType === "FREE_SHIPPING" && "Free Shipping"}
              </Td>
              <Td>
                {c.usageCount}
                {c.usageLimit ? ` / ${c.usageLimit}` : ""}
              </Td>
              <Td>{new Date(c.endDate).toLocaleDateString()}</Td>
              <Td>
                <button onClick={() => handleToggle(c.code, c.isActive)}>
                  <Badge tone={c.isActive ? "success" : "outline"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                </button>
              </Td>
              <Td className="text-right">
                <button onClick={() => handleDelete(c.code)} className="text-ink-soft hover:text-sale">
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
