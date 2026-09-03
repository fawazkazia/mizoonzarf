"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/admin/FormField";
import { assignStaffRole } from "../actions";

export function StaffRoleSelect({ userId, staffRoleId, roles }: { userId: string; staffRoleId: string; roles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [value, setValue] = useState(staffRoleId);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: string) {
    const previous = value;
    setValue(next);
    setLoading(true);
    try {
      await assignStaffRole(userId, next);
      toast.success("Role updated.");
      router.refresh();
    } catch (err) {
      setValue(previous);
      toast.error(err instanceof Error ? err.message : "Couldn't update role.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={value} disabled={loading} onChange={(e) => handleChange(e.target.value)} className="!py-1.5">
      {roles.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </Select>
  );
}
