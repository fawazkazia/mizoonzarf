"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

interface LibValue {
  value: string;
  hex?: string;
}

/** Dropdown checklist for picking from the reusable attribute-value library — click a row to
 * toggle it on/off the current attribute's value list. Stays open across toggles so the admin
 * can pick several in one go; closes on an outside click. */
export function AttributeValueMultiSelect({
  libraryValues,
  selectedValues,
  isColor,
  onToggle,
}: {
  libraryValues: LibValue[];
  selectedValues: string[];
  isColor: boolean;
  onToggle: (v: LibValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const selectedLower = new Set(selectedValues.map((v) => v.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 border border-line px-3 py-2 text-xs hover:border-ink"
      >
        Select existing values <ChevronDown size={13} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-64 overflow-y-auto border border-line bg-paper-raise shadow-lg">
          {libraryValues.length === 0 && <p className="p-3 text-xs text-ink-soft">No saved values yet — add one below.</p>}
          {libraryValues.map((v) => {
            const checked = selectedLower.has(v.value.toLowerCase());
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => onToggle(v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-paper-dim"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center border ${checked ? "border-ink bg-ink text-paper" : "border-line"}`}
                >
                  {checked && <Check size={11} />}
                </span>
                {isColor && v.hex && <span className="h-3 w-3 shrink-0 rounded-full border border-line" style={{ backgroundColor: v.hex }} />}
                {v.value}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
