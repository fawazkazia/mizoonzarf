"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/admin/FormField";

export function AsOfDatePicker({ value }: { value: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-sm text-ink-soft">
      <span>As of</span>
      <Input
        type="date"
        value={value}
        onChange={(e) => router.push(`/admin/finance/reports/balance-sheet?asOf=${e.target.value}`)}
        className="!py-1.5"
      />
    </div>
  );
}
