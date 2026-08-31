"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Fieldset } from "@/components/admin/FormField";
import { createStaffAccount } from "./actions";

const STAFF_ROLE_OPTIONS = [
  "SUPER_ADMIN",
  "BUSINESS_OWNER",
  "FINANCE",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "MARKETING_MANAGER",
  "CUSTOMER_SUPPORT",
  "INVENTORY_MANAGER",
] as const;

export function CreateStaffForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof STAFF_ROLE_OPTIONS)[number]>("CUSTOMER_SUPPORT");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createStaffAccount({ name, email, password, role });
      toast.success("Staff account created.");
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Fieldset title="Create Staff Account">
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Temporary Password" hint="At least 8 characters">
          <Input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            {STAFF_ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </Fieldset>
      <Button type="submit" size="sm" disabled={loading} className="mt-4">
        {loading ? "Creating..." : "Create Account"}
      </Button>
    </form>
  );
}
