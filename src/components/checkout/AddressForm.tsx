"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { StructuredAddress } from "@/lib/geo/provider";
import { ADDRESS_FIELD_ORDER, NO_POSTAL_CODE_COUNTRIES, type AddressFormValue } from "@/lib/validation/address-client";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { CountrySelect } from "./CountrySelect";
import { StateSelect } from "./StateSelect";
import { PhoneInput } from "./PhoneInput";

export type { AddressFormValue };

type FieldKey = (typeof ADDRESS_FIELD_ORDER)[number];
type FieldErrors = Partial<Record<FieldKey, string>>;

function inputClass(error?: string) {
  return cn(
    "min-h-[44px] w-full border bg-paper px-3 py-2.5 text-sm outline-none",
    error ? "border-sale" : "border-line focus:border-ink"
  );
}

function Label({ required, children }: { required: boolean; children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
      {children} {required ? <span className="text-sale">*</span> : <span className="normal-case text-ink-mute">(optional)</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-sale">{message}</p>;
}

export function AddressForm({
  value,
  onChange,
  errors = {},
  showSearch = true,
}: {
  value: AddressFormValue;
  onChange: (patch: Partial<AddressFormValue>) => void;
  errors?: FieldErrors;
  showSearch?: boolean;
}) {
  const touchedRef = useRef<Set<string>>(new Set());
  const phoneCountryManual = useRef(false);
  const prevCountryRef = useRef(value.country);

  useEffect(() => {
    if (value.country !== prevCountryRef.current) {
      prevCountryRef.current = value.country;
      if (!phoneCountryManual.current) onChange({ phoneCountry: value.country });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.country]);

  function setTouched(key: string, patch: Partial<AddressFormValue>) {
    touchedRef.current.add(key);
    onChange(patch);
  }

  function handleResolved(address: StructuredAddress) {
    const patch: Partial<AddressFormValue> = {};
    if (!touchedRef.current.has("line1") && address.line1) patch.line1 = address.line1;
    if (!touchedRef.current.has("city") && address.city) patch.city = address.city;
    if (!touchedRef.current.has("state") && address.state) patch.state = address.state;
    if (!touchedRef.current.has("postalCode") && address.postalCode) patch.postalCode = address.postalCode;
    if (!touchedRef.current.has("country") && address.country) patch.country = address.country;
    onChange(patch);
  }

  function handleCountryChange(code: string) {
    touchedRef.current.add("country");
    onChange({ country: code, state: "" });
  }

  const postalOptional = NO_POSTAL_CODE_COUNTRIES.has(value.country);

  return (
    <div className="flex flex-col gap-4">
      {showSearch && <AddressAutocomplete onResolved={handleResolved} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>First Name</Label>
          <input
            id="address-firstName"
            value={value.firstName}
            onChange={(e) => setTouched("firstName", { firstName: e.target.value })}
            className={inputClass(errors.firstName)}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <Label required>Last Name</Label>
          <input
            id="address-lastName"
            value={value.lastName}
            onChange={(e) => setTouched("lastName", { lastName: e.target.value })}
            className={inputClass(errors.lastName)}
          />
          <FieldError message={errors.lastName} />
        </div>

        <div className="sm:col-span-2">
          <Label required>Phone Number</Label>
          <PhoneInput
            id="address-phone"
            countryCode={value.phoneCountry}
            onCountryCodeChange={(code) => {
              phoneCountryManual.current = true;
              onChange({ phoneCountry: code });
            }}
            value={value.phoneNational}
            onChange={(national, e164) => onChange({ phoneNational: national, phoneE164: e164 })}
            error={errors.phone}
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="sm:col-span-2">
          <Label required>Country</Label>
          <CountrySelect id="address-country" value={value.country} onChange={handleCountryChange} error={errors.country} />
          <FieldError message={errors.country} />
        </div>

        <div className="sm:col-span-2">
          <Label required={false}>House / Flat / Building No.</Label>
          <input
            value={value.apartment}
            onChange={(e) => onChange({ apartment: e.target.value })}
            placeholder="e.g. Flat 402, Shree Apartments"
            className={inputClass()}
          />
        </div>

        <div className="sm:col-span-2">
          <Label required>Street / Area</Label>
          <input
            id="address-line1"
            value={value.line1}
            onChange={(e) => setTouched("line1", { line1: e.target.value })}
            placeholder="Street, road, area, colony"
            className={inputClass(errors.line1)}
          />
          <FieldError message={errors.line1} />
        </div>

        <div className="sm:col-span-2">
          <Label required={false}>Landmark</Label>
          <input
            value={value.line2}
            onChange={(e) => setTouched("line2", { line2: e.target.value })}
            placeholder="e.g. Near City Mall"
            className={inputClass()}
          />
        </div>

        <div>
          <Label required>City</Label>
          <input
            id="address-city"
            value={value.city}
            onChange={(e) => setTouched("city", { city: e.target.value })}
            className={inputClass(errors.city)}
          />
          <FieldError message={errors.city} />
        </div>

        <div>
          <Label required>State / Province</Label>
          <StateSelect
            id="address-state"
            countryCode={value.country}
            value={value.state}
            onChange={(state) => setTouched("state", { state })}
            error={errors.state}
          />
          <FieldError message={errors.state} />
        </div>

        <div className="sm:col-span-2">
          <Label required={!postalOptional}>{value.country === "IN" ? "PIN Code" : "Postal / ZIP Code"}</Label>
          <input
            id="address-postalCode"
            value={value.postalCode}
            onChange={(e) => setTouched("postalCode", { postalCode: e.target.value })}
            className={inputClass(errors.postalCode)}
          />
          <FieldError message={errors.postalCode} />
        </div>
      </div>
    </div>
  );
}
