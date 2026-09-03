"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

/** Same URL-driven filter mechanics as StatusFilterSelect, but keyed by StaffRole id with a
 * separate display name — StatusFilterSelect assumes the option value itself is presentable. */
export function RoleFilterSelect({ roles }: { roles: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={searchParams.get("role") ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set("role", e.target.value);
        else params.delete("role");
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="border border-line bg-paper px-3 py-2 text-xs uppercase tracking-wide"
    >
      <option value="">All Roles</option>
      {roles.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
