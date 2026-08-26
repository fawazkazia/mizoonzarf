"use client";

import { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { getCountriesClient } from "@/lib/geo/countries-client";
import type { CountryOption } from "@/lib/geo/countries";

export function CountrySelect({
  value,
  onChange,
  error,
  disabled,
  id,
}: {
  value: string;
  onChange: (countryCode: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [countries, setCountries] = useState<CountryOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCountriesClient().then((list) => {
      if (!cancelled) setCountries(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Combobox
      aria-label="Country"
      placeholder={countries.length === 0 ? "Loading countries..." : "Select a country"}
      searchPlaceholder="Search countries..."
      value={value || null}
      onChange={onChange}
      disabled={disabled || countries.length === 0}
      error={error}
      items={countries.map((c) => ({ value: c.code, label: c.name, icon: <span>{c.flag}</span>, keywords: c.code }))}
      triggerId={id}
    />
  );
}
