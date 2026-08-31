"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/admin/FormField";
import { updateUserRole } from "./actions";
import type { Role } from "@/generated/prisma/client";

const ROLE_OPTIONS: Role[] = [
  "CUSTOMER",
  "SUPER_ADMIN",
  "BUSINESS_OWNER",
  "FINANCE",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "MARKETING_MANAGER",
  "CUSTOMER_SUPPORT",
  "INVENTORY_MANAGER",
];

export function UserRoleSelect({ userId, role }: { userId: string; role: Role }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: Role) {
    setValue(next);
    setLoading(true);
    try {
      await updateUserRole(userId, next);
      toast.success("Role updated.");
      router.refresh();
    } catch (err) {
      setValue(role);
      toast.error(err instanceof Error ? err.message : "Couldn't update role.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={value} disabled={loading} onChange={(e) => handleChange(e.target.value as Role)} className="!py-1.5">
      {ROLE_OPTIONS.map((r) => (
        <option key={r} value={r}>
          {r.replace(/_/g, " ")}
        </option>
      ))}
    </Select>
  );
}
