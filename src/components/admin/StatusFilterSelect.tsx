"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function StatusFilterSelect({
  options,
  paramKey = "status",
  placeholder = "All Statuses",
}: {
  options: string[];
  paramKey?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={searchParams.get(paramKey) ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set(paramKey, e.target.value);
        else params.delete(paramKey);
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="border border-line bg-paper px-3 py-2 text-xs uppercase tracking-wide"
    >
      <option value="">{placeholder}</option>
      {options.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
