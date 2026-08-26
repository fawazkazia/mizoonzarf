"use client";

import { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { getStatesClient } from "@/lib/geo/countries-client";
import type { StateOption } from "@/lib/geo/countries";
import { cn } from "@/lib/utils";

export function StateSelect({
  countryCode,
  value,
  onChange,
  error,
  id,
}: {
  countryCode: string;
  value: string;
  onChange: (state: string) => void;
  error?: string;
  id?: string;
}) {
  const [states, setStates] = useState<StateOption[] | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setStates(null);
      return;
    }
    let cancelled = false;
    setStates(null);
    getStatesClient(countryCode).then((list) => {
      if (!cancelled) setStates(list);
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  if (states === null) {
    return (
      <input
        id={id}
        disabled
        placeholder="Loading..."
        className="min-h-[44px] w-full border border-line bg-paper px-3 py-2.5 text-sm text-ink-mute outline-none"
      />
    );
  }

  if (states.length > 0) {
    return (
      <Combobox
        aria-label="State / Province"
        placeholder="Select a state / province"
        searchPlaceholder="Search states..."
        value={value || null}
        onChange={onChange}
        error={error}
        items={states.map((s) => ({ value: s.name, label: s.name }))}
        triggerId={id}
      />
    );
  }

  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="State / Province / Region"
      className={cn(
        "min-h-[44px] w-full border bg-paper px-3 py-2.5 text-sm outline-none",
        error ? "border-sale" : "border-line focus:border-ink"
      )}
    />
  );
}
