"use client";

import { useEffect, useState } from "react";
import { AsYouType, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { Combobox } from "@/components/ui/Combobox";
import { getCountriesClient } from "@/lib/geo/countries-client";
import type { CountryOption } from "@/lib/geo/countries";
import { cn } from "@/lib/utils";

/**
 * National AsYouType formatting expects the local trunk prefix (e.g. "0" in
 * "050 123 4567"), which this field never asks for since the calling code is
 * a separate selector. Feeding it through the international formatter (with
 * the calling code temporarily prepended, then stripped back off) gives
 * sensible grouping for a bare national number in every country.
 */
function formatAndValidate(raw: string, countryCode: string): { formatted: string; e164: string | null; valid: boolean } {
  const digits = raw.replace(/\D/g, "");
  const iso = (countryCode || undefined) as CountryCode | undefined;

  let formatted = digits;
  if (iso && digits) {
    try {
      const callingCode = getCountryCallingCode(iso);
      const prefix = `+${callingCode} `;
      const international = new AsYouType().input(`+${callingCode}${digits}`);
      formatted = international.startsWith(prefix) ? international.slice(prefix.length) : international.replace(`+${callingCode}`, "").trim();
    } catch {
      formatted = digits;
    }
  }

  const parsed = digits && iso ? parsePhoneNumberFromString(digits, iso) : undefined;
  const valid = Boolean(parsed?.isValid());
  return { formatted, e164: valid ? parsed!.number : null, valid };
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  value,
  onChange,
  error,
  id,
}: {
  /** ISO2 of the calling code (independent from the shipping country once the customer overrides it). */
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  /** Raw national-format display value as typed. */
  value: string;
  onChange: (national: string, e164: string | null, isValid: boolean) => void;
  error?: string;
  id?: string;
}) {
  const [countries, setCountries] = useState<CountryOption[]>([]);

  useEffect(() => {
    getCountriesClient().then(setCountries);
  }, []);

  function handleNumberChange(raw: string) {
    const { formatted, e164, valid } = formatAndValidate(raw, countryCode);
    onChange(formatted, e164, valid);
  }

  return (
    <div className="flex">
      <Combobox
        aria-label="Country calling code"
        value={countryCode || null}
        onChange={(code) => {
          onCountryCodeChange(code);
          const { formatted, e164, valid } = formatAndValidate(value, code);
          onChange(formatted, e164, valid);
        }}
        triggerClassName="w-[100px] shrink-0 border-r-0"
        renderTrigger={(item) => (
          <span className="flex items-center gap-1.5 text-sm">
            {item?.icon}
            <span>{item?.sublabel ?? "+--"}</span>
          </span>
        )}
        items={countries.map((c) => ({
          value: c.code,
          label: c.name,
          sublabel: c.dialCode,
          icon: <span>{c.flag}</span>,
          keywords: c.dialCode,
        }))}
      />
      <input
        id={id}
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder="50 123 4567"
        aria-label="Phone number"
        className={cn(
          "min-h-[44px] flex-1 border bg-paper px-3 py-2.5 text-sm outline-none",
          error ? "border-sale" : "border-line focus:border-ink"
        )}
      />
    </div>
  );
}
