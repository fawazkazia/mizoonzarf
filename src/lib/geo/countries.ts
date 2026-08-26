import { Country, State } from "country-state-city";

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export interface StateOption {
  code: string;
  name: string;
}

let cachedCountries: CountryOption[] | null = null;

/** Full country list (name, ISO2, dial code, flag emoji) — static data, computed once per server process. */
export function getAllCountries(): CountryOption[] {
  if (!cachedCountries) {
    cachedCountries = Country.getAllCountries()
      .map((c) => ({
        code: c.isoCode,
        name: c.name,
        dialCode: `+${c.phonecode.replace(/^\+/, "")}`,
        flag: c.flag,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return cachedCountries;
}

/** States/provinces for a country. Empty array means the UI should fall back to free-text entry. */
export function getStatesForCountry(countryCode: string): StateOption[] {
  return State.getStatesOfCountry(countryCode.toUpperCase()).map((s) => ({ code: s.isoCode, name: s.name }));
}
