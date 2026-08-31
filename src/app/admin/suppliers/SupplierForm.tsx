"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Checkbox, Fieldset } from "@/components/admin/FormField";
import { createSupplier, updateSupplier } from "./actions";
import type { SupplierInput } from "@/lib/validation/admin-finance";

export interface SupplierFormInitial {
  id: string;
  name: string;
  code: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  isActive: boolean;
}

export function SupplierForm({ initial }: { initial?: SupplierFormInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [gstin, setGstin] = useState(initial?.gstin ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: SupplierInput = { name, code, contactName, email, phone, address, gstin, isActive };

    setLoading(true);
    try {
      if (initial) {
        await updateSupplier(initial.id, payload);
        toast.success("Supplier updated.");
      } else {
        await createSupplier(payload);
        toast.success("Supplier created.");
      }
      router.push("/admin/suppliers");
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
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Code" hint="A short internal reference, e.g. SUP-001">
          <Input required value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Contact Name">
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="GSTIN">
          <Input value={gstin} onChange={(e) => setGstin(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </div>
        <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </Fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : initial ? "Save Changes" : "Create Supplier"}
      </Button>
    </form>
  );
}
