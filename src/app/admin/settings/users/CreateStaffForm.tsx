"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, Input, Select, Fieldset } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { createStaffAccount } from "./actions";

const COMMON_DEPARTMENTS = ["Sales", "Customer Support", "Warehouse", "Accounting", "Marketing", "Content", "IT & Admin"];

export function CreateStaffForm({ roles }: { roles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffRoleId, setStaffRoleId] = useState(roles[0]?.id ?? "");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staffRoleId) {
      toast.error("Choose a role.");
      return;
    }
    setLoading(true);
    try {
      await createStaffAccount({ name, email, password, staffRoleId, department, jobTitle, phone, image: image ?? undefined });
      toast.success("Staff account created.");
      setName("");
      setEmail("");
      setPassword("");
      setDepartment("");
      setJobTitle("");
      setPhone("");
      setImage(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Fieldset title="Create Staff Account">
        <div className="sm:col-span-2">
          <Field label="Profile Photo">
            <SingleImageUploader value={image} onChange={setImage} />
          </Field>
        </div>
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Temporary Password" hint="At least 8 characters">
          <Input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Mobile Number">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Department">
          <Input list="department-options" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Customer Support" />
          <datalist id="department-options">
            {COMMON_DEPARTMENTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Job Title">
          <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Support Agent" />
        </Field>
        <Field label="Role">
          <Select value={staffRoleId} onChange={(e) => setStaffRoleId(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
      </Fieldset>
      <Button type="submit" size="sm" disabled={loading} className="self-start">
        {loading ? "Creating..." : "Create Account"}
      </Button>
    </form>
  );
}
