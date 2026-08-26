"use client";

import { cn } from "@/lib/utils";

const PRESETS = ["Home", "Office", "Other"];

export function AddressLabelPicker({ value, onChange }: { value: string; onChange: (label: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(value === preset ? "" : preset)}
          className={cn(
            "min-h-[36px] border px-4 text-xs uppercase tracking-[0.08em] transition-colors",
            value === preset ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink"
          )}
        >
          {preset}
        </button>
      ))}
    </div>
  );
}
