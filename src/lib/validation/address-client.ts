/** Countries with no nationwide postal/ZIP code system — postal code is optional for these. */
export const NO_POSTAL_CODE_COUNTRIES = new Set([
  "AO", "AG", "AW", "BS", "BZ", "BJ", "BW", "BF", "BI", "CM", "CF", "TD", "KM", "CG", "CD", "CK", "CI", "DJ", "DM",
  "GQ", "ER", "FJ", "TF", "GM", "GH", "GD", "GN", "GY", "HK", "JM", "KE", "KI", "KP", "LY", "MO", "MW", "ML", "MR",
  "MU", "MS", "NR", "NU", "QA", "RW", "KN", "LC", "VC", "ST", "SC", "SL", "SB", "SO", "SR", "SY", "TZ", "TL", "TG",
  "TK", "TO", "TT", "TV", "UG", "AE", "VU", "YE", "ZW",
]);

export interface AddressFormValue {
  firstName: string;
  lastName: string;
  phoneCountry: string;
  phoneNational: string;
  phoneE164: string | null;
  country: string;
  line1: string;
  line2: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
}

export const EMPTY_ADDRESS_FORM: AddressFormValue = {
  firstName: "",
  lastName: "",
  phoneCountry: "IN",
  phoneNational: "",
  phoneE164: null,
  country: "IN",
  line1: "",
  line2: "",
  apartment: "",
  city: "",
  state: "",
  postalCode: "",
};

const INDIA_PIN_CODE = /^[1-9][0-9]{5}$/;

/** Order matters — this is the order fields appear in the form, used to focus the first invalid one. */
export const ADDRESS_FIELD_ORDER = ["firstName", "lastName", "phone", "country", "line1", "city", "state", "postalCode"] as const;

type FieldKey = (typeof ADDRESS_FIELD_ORDER)[number];

export function validateAddress(value: AddressFormValue): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};

  if (!value.firstName.trim()) errors.firstName = "Please enter your first name.";
  if (!value.lastName.trim()) errors.lastName = "Please enter your last name.";
  if (!value.phoneE164) errors.phone = "Please enter a valid phone number.";
  if (!value.country) errors.country = "Please select your country.";
  if (!value.line1.trim()) errors.line1 = "Please enter your street address.";
  if (!value.city.trim()) errors.city = "Please enter your city.";
  if (!value.state.trim()) errors.state = "Please enter your state / province.";
  if (!value.postalCode.trim() && !NO_POSTAL_CODE_COUNTRIES.has(value.country)) {
    errors.postalCode = "Please enter your postal code.";
  } else if (value.country === "IN" && !INDIA_PIN_CODE.test(value.postalCode.trim())) {
    errors.postalCode = "Please enter a valid 6-digit PIN code.";
  }

  return errors;
}

export function firstInvalidField(errors: Partial<Record<FieldKey, string>>): FieldKey | null {
  return ADDRESS_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

/** Scrolls to and focuses the first invalid field so the customer sees what needs fixing. */
export function focusFirstInvalidField(errors: Partial<Record<FieldKey, string>>) {
  const field = firstInvalidField(errors);
  if (!field) return;
  const el = document.getElementById(`address-${field}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  el?.focus();
}

/** Shape expected by /api/checkout and /api/addresses (matches the Address DB columns 1:1). */
export interface SubmitAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export function toSubmitAddress(value: AddressFormValue): SubmitAddress {
  const line2 = [value.apartment.trim(), value.line2.trim()].filter(Boolean).join(", ");
  return {
    fullName: `${value.firstName.trim()} ${value.lastName.trim()}`.trim(),
    phone: value.phoneE164 ?? value.phoneNational,
    line1: value.line1.trim(),
    line2: line2 || undefined,
    city: value.city.trim(),
    state: value.state.trim() || undefined,
    country: value.country,
    postalCode: value.postalCode.trim() || undefined,
  };
}

/** Reverse of toSubmitAddress — used to pre-fill the form when editing a saved address. */
export function fromSavedAddress(saved: {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
}): AddressFormValue {
  const spaceIndex = saved.fullName.indexOf(" ");
  const firstName = spaceIndex === -1 ? saved.fullName : saved.fullName.slice(0, spaceIndex);
  const lastName = spaceIndex === -1 ? "" : saved.fullName.slice(spaceIndex + 1);

  return {
    firstName,
    lastName,
    phoneCountry: saved.country || "IN",
    phoneNational: saved.phone,
    phoneE164: saved.phone.startsWith("+") ? saved.phone : null,
    country: saved.country,
    line1: saved.line1,
    line2: saved.line2 ?? "",
    apartment: "",
    city: saved.city,
    state: saved.state ?? "",
    postalCode: saved.postalCode ?? "",
  };
}
