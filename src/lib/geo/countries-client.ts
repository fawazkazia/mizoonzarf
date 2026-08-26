"use client";

import type { CountryOption, StateOption } from "./countries";

let countriesPromise: Promise<CountryOption[]> | null = null;
const statesCache = new Map<string, Promise<StateOption[]>>();

/** Fetches the static country list once per page load and memoizes it (no need to re-fetch per component instance). */
export function getCountriesClient(): Promise<CountryOption[]> {
  if (!countriesPromise) {
    countriesPromise = fetch("/api/geo/countries")
      .then((res) => res.json())
      .then((data) => data.countries as CountryOption[])
      .catch((err) => {
        countriesPromise = null;
        throw err;
      });
  }
  return countriesPromise;
}

export function getStatesClient(countryCode: string): Promise<StateOption[]> {
  const key = countryCode.toUpperCase();
  if (!statesCache.has(key)) {
    statesCache.set(
      key,
      fetch(`/api/geo/states?country=${encodeURIComponent(key)}`)
        .then((res) => res.json())
        .then((data) => data.states as StateOption[])
        .catch((err) => {
          statesCache.delete(key);
          throw err;
        })
    );
  }
  return statesCache.get(key)!;
}
