"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function AssigneeFilterSelect({ staff }: { staff: { id: string; name: string | null; email: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={searchParams.get("assignee") ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set("assignee", e.target.value);
        else params.delete("assignee");
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="border border-line bg-paper px-3 py-2 text-xs uppercase tracking-wide"
    >
      <option value="">All Employees</option>
      {staff.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name ?? s.email}
        </option>
      ))}
    </select>
  );
}
