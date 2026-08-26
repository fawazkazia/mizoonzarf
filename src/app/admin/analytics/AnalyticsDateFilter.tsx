"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DATE_PRESETS, DATE_PRESET_LABELS, type DatePreset } from "@/lib/data/date-presets";
import { Input } from "@/components/admin/FormField";
import { cn } from "@/lib/utils";

export function AnalyticsDateFilter({ activePreset, from, to }: { activePreset: DatePreset | null; from: string; to: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPreset(preset: DatePreset) {
    const params = new URLSearchParams(searchParams);
    params.set("preset", preset);
    params.delete("from");
    params.delete("to");
    router.push(`/admin/analytics?${params.toString()}`);
  }

  function setCustomDate(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("preset");
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/analytics?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPreset(preset)}
            className={cn(
              "border px-3 py-1.5 text-xs uppercase tracking-wide",
              activePreset === preset ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink"
            )}
          >
            {DATE_PRESET_LABELS[preset]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-ink-soft">
        <Input type="date" value={from} onChange={(e) => setCustomDate("from", e.target.value)} className="!py-1.5" />
        <span>to</span>
        <Input type="date" value={to} onChange={(e) => setCustomDate("to", e.target.value)} className="!py-1.5" />
      </div>
    </div>
  );
}
