"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DATE_PRESETS, DATE_PRESET_LABELS, resolvePresetRange, type DatePreset } from "@/lib/data/date-presets";
import { Input } from "@/components/admin/FormField";
import { cn } from "@/lib/utils";

/** Shared date-range filter for the newer finance reports (Product/Customer Profitability, Tax,
 * Supplier Purchases) — the P&L/Cash Flow pages keep their own earlier copies of this same
 * pattern rather than being refactored to use this one, since they already ship and work. */
export function ReportDateFilter({ basePath, activePreset, from, to }: { basePath: string; activePreset: DatePreset | null; from: string; to: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPreset(preset: DatePreset) {
    const params = new URLSearchParams(searchParams);
    params.set("preset", preset);
    params.delete("from");
    params.delete("to");
    router.push(`${basePath}?${params.toString()}`);
  }

  function setCustomDate(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("preset");
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${basePath}?${params.toString()}`);
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

/** Shared date-range resolution — same logic each existing report page (P&L, Cash Flow)
 * duplicates inline; factored out here for the new pages that share this file. When a preset is
 * active, both `from` and `to` come from resolvePresetRange (some presets, like "last_month",
 * have a `to` that isn't just "now") — only the custom from/to path defaults `to` to now. */
export function resolveReportRange(
  sp: { preset?: string; from?: string; to?: string },
  defaultPreset: DatePreset = "this_month"
): { preset: DatePreset | null; range: { from: Date; to: Date } } {
  const isValidPreset = (v?: string): v is DatePreset => !!v && (DATE_PRESETS as readonly string[]).includes(v);
  const preset: DatePreset | null = !sp.from && !sp.to ? (isValidPreset(sp.preset) ? sp.preset : defaultPreset) : null;
  const range = preset
    ? resolvePresetRange(preset)
    : {
        from: sp.from ? new Date(sp.from) : resolvePresetRange("30d").from,
        to: sp.to ? new Date(new Date(sp.to).setHours(23, 59, 59, 999)) : new Date(),
      };
  return { preset, range };
}
