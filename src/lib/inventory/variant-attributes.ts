/**
 * Shared helpers for the generic product-variant attribute system (Size, Colour, Waist,
 * Shoe Size, ... any admin-defined axis). `ProductVariant.attributeValues` is the source of
 * truth going forward; `size`/`color`/`colorHex` are legacy columns kept in sync as mirrors so
 * every call site that still reads them directly (catalog facets/filters) keeps working
 * unchanged. Every *new* or *updated* display call site should read through `variantAttrs()`
 * instead of touching `.size`/`.color` directly, since the mirrors are only populated when an
 * attribute happens to be literally named "Size"/"Colour".
 */

export interface VariantAttr {
  name: string;
  value: string;
  hex?: string;
}

interface MirrorSource {
  attributeValues: unknown;
  size: string | null;
  color: string | null;
  colorHex: string | null;
}

const SIZE_NAME = /^size$/i;
const COLOR_NAME = /^colou?r$/i;

/** Parses the raw JSON column into a typed array, tolerating null/malformed/legacy-empty values. */
export function parseAttributeValues(raw: unknown): VariantAttr[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is VariantAttr => !!a && typeof a === "object" && typeof (a as VariantAttr).name === "string" && typeof (a as VariantAttr).value === "string"
  );
}

/** Derives the legacy size/color/colorHex mirror columns from a variant's attribute list — write-time only. */
export function deriveMirrorFields(attrs: VariantAttr[]): { size: string | null; color: string | null; colorHex: string | null } {
  const size = attrs.find((a) => SIZE_NAME.test(a.name));
  const color = attrs.find((a) => COLOR_NAME.test(a.name));
  return {
    size: size?.value ?? null,
    color: color?.value ?? null,
    colorHex: color?.hex ?? null,
  };
}

/**
 * Reads a variant's attribute list. Prefers the structured `attributeValues` column; falls back
 * to synthesizing `[Size, Colour]` from the legacy scalar columns for pre-migration rows (or any
 * row saved with an empty attribute list) so old data keeps rendering correctly everywhere.
 */
export function variantAttrs(variant: MirrorSource): VariantAttr[] {
  const structured = parseAttributeValues(variant.attributeValues);
  if (structured.length > 0) return structured;

  const legacy: VariantAttr[] = [];
  if (variant.size) legacy.push({ name: "Size", value: variant.size });
  if (variant.color) legacy.push({ name: "Colour", value: variant.color, hex: variant.colorHex ?? undefined });
  return legacy;
}

/** Human-readable "M / Black / Slim" label from an already-resolved attribute list. */
export function formatAttrs(attrs: VariantAttr[]): string {
  return attrs.map((a) => a.value).join(" / ");
}

/** Human-readable "M / Black / Slim" label, replacing the old `[size,color].filter(Boolean).join(" / ")` pattern. */
export function formatVariantLabel(variant: MirrorSource): string {
  return formatAttrs(variantAttrs(variant));
}

/** Order-independent identity key for an attribute combination, e.g. "Colour:Black|Size:M". */
export function comboKey(attrs: VariantAttr[]): string {
  return attrs
    .map((a) => `${a.name}:${a.value}`)
    .sort()
    .join("|");
}

export interface LibValue {
  value: string;
  hex?: string;
}

/**
 * Additive, case-insensitive-by-value merge of an attribute's value pool — existing entries win
 * on conflict (never silently overwritten by a same-named-different-cased addition). Shared by
 * the attribute-value library and the CSV importer's attribute-def merge, so both stay consistent.
 */
export function mergeValues(existing: LibValue[], additions: LibValue[]): LibValue[] {
  const seen = new Map(existing.map((v) => [v.value.toLowerCase(), v]));
  for (const v of additions) {
    const trimmed = v.value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) seen.set(key, { value: trimmed, hex: v.hex });
  }
  return [...seen.values()];
}
