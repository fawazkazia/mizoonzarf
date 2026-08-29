import Papa from "papaparse";
import { comboKey, type VariantAttr } from "@/lib/inventory/variant-attributes";
import type { ProductInput } from "@/lib/validation/admin-product";

export interface ImportLookup {
  existingProductSkus: string[];
  variantOwners: { variantSku: string; productId: string; productSku: string }[];
}

export const CSV_COLUMNS = [
  "Product SKU",
  "Product Name",
  "Slug",
  "Category",
  "Brand",
  "Gender",
  "Status",
  "Description",
  "Short Description",
  "Material",
  "Fit Info",
  "Care Instructions",
  "Tags",
  "Images",
  "Variant SKU",
  "Barcode",
  "Attributes",
  "Colour Hex",
  "Price",
  "Sale Price",
  "Stock",
  "Low Stock Alert",
] as const;

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface BrandOption {
  id: string;
  name: string;
}

export interface ImportVariantDraft {
  lineNumber: number;
  sku: string;
  errors: string[];
}

export interface ProductGroup {
  productSku: string;
  lineNumbers: number[];
  input: ProductInput;
  variantDrafts: ImportVariantDraft[];
  errors: string[];
  warnings: string[];
  mode: "create" | "update";
}

export interface ParseResult {
  groups: ProductGroup[];
  /** Rows with no Product SKU at all — can't be grouped, reported separately. */
  unassignedRowErrors: { lineNumber: number; message: string }[];
}

const COLOR_NAME = /^colou?r$/i;
const GENDERS = new Set(["MEN", "WOMEN", "KIDS", "UNISEX"]);
const STATUSES = new Set(["DRAFT", "ACTIVE", "ARCHIVED"]);

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function cell(row: Record<string, string>, key: string): string {
  return (row[key] ?? "").trim();
}

function cellOrUndefined(row: Record<string, string>, key: string): string | undefined {
  const v = cell(row, key);
  return v || undefined;
}

function parseAttributesCell(raw: string, colourHex: string): VariantAttr[] {
  if (!raw.trim()) return [];
  return raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf(":");
      const name = (idx === -1 ? part : part.slice(0, idx)).trim();
      const value = (idx === -1 ? "" : part.slice(idx + 1)).trim();
      const hex = COLOR_NAME.test(name) && colourHex.trim() ? colourHex.trim() : undefined;
      return { name, value, hex };
    })
    .filter((a) => a.name && a.value);
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

/** Parses raw CSV text into rows. Throws on unrecoverable parse errors (e.g. malformed file). */
export function parseCsvText(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(result.errors[0].message);
  }
  return result.data;
}

/**
 * Groups rows by Product SKU (forward-filling blank product-level cells from each group's first
 * non-blank row), validates every row, resolves Category/Brand, and builds a ready-to-submit
 * ProductInput per group. Does NOT hit the network — DB-dependent checks (create-vs-update mode,
 * cross-product SKU conflicts) are applied afterward via applyConflicts().
 */
export function buildProductGroups(rows: Record<string, string>[], categories: CategoryOption[], brands: BrandOption[]): ParseResult {
  const categoryBySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c]));
  const brandByName = new Map(brands.map((b) => [b.name.toLowerCase(), b]));

  const order: string[] = [];
  const rowsBySku = new Map<string, { raw: Record<string, string>; lineNumber: number }[]>();
  const unassignedRowErrors: ParseResult["unassignedRowErrors"] = [];

  rows.forEach((raw, i) => {
    const lineNumber = i + 2; // +1 for 0-index, +1 for the header row
    const sku = cell(raw, "Product SKU");
    if (!sku) {
      unassignedRowErrors.push({ lineNumber, message: "Missing Product SKU — row skipped." });
      return;
    }
    if (!rowsBySku.has(sku)) {
      rowsBySku.set(sku, []);
      order.push(sku);
    }
    rowsBySku.get(sku)!.push({ raw, lineNumber });
  });

  const groups: ProductGroup[] = order.map((productSku) => {
    const groupRows = rowsBySku.get(productSku)!;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Forward-fill product-level fields from the first row that actually has each one.
    const productFields = ["Product Name", "Slug", "Category", "Brand", "Gender", "Status", "Description", "Short Description", "Material", "Fit Info", "Care Instructions", "Tags", "Images"];
    const resolved: Record<string, string> = {};
    for (const field of productFields) {
      const withValue = groupRows.find((r) => cell(r.raw, field));
      if (withValue) resolved[field] = cell(withValue.raw, field);
    }
    for (const field of productFields) {
      const first = groupRows[0];
      const firstVal = cell(first.raw, field);
      if (!firstVal) continue;
      for (const r of groupRows.slice(1)) {
        const v = cell(r.raw, field);
        if (v && v !== firstVal) {
          warnings.push(`Line ${r.lineNumber}: "${field}" ("${v}") differs from this product's first row ("${firstVal}") — first row's value was used.`);
        }
      }
    }

    const name = resolved["Product Name"] ?? "";
    if (!name) errors.push("Missing Product Name.");
    const slug = resolved["Slug"] || slugify(name);
    if (!slug) errors.push("Couldn't derive a Slug from the Product Name — provide one explicitly.");

    const categorySlug = resolved["Category"] ?? "";
    const category = categoryBySlug.get(categorySlug.toLowerCase());
    if (!categorySlug) errors.push("Missing Category.");
    else if (!category) errors.push(`Category "${categorySlug}" doesn't match any existing category slug.`);

    const brandName = resolved["Brand"] ?? "";
    const brand = brandName ? brandByName.get(brandName.toLowerCase()) : undefined;
    if (brandName && !brand) errors.push(`Brand "${brandName}" doesn't match any existing brand.`);

    const gender = (resolved["Gender"] ?? "").toUpperCase();
    if (!gender) errors.push("Missing Gender.");
    else if (!GENDERS.has(gender)) errors.push(`Gender "${resolved["Gender"]}" must be one of MEN, WOMEN, KIDS, UNISEX.`);

    const status = (resolved["Status"] || "ACTIVE").toUpperCase();
    if (!STATUSES.has(status)) errors.push(`Status "${resolved["Status"]}" must be one of DRAFT, ACTIVE, ARCHIVED.`);

    const description = resolved["Description"] ?? "";
    if (!description) errors.push("Missing Description.");

    const images = (resolved["Images"] ?? "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const url of images) {
      if (!isValidUrl(url)) errors.push(`Image URL "${url}" doesn't look like a valid URL.`);
    }

    // Variants
    const variantDrafts: ImportVariantDraft[] = [];
    const variants: ProductInput["variants"] = [];
    const skusInGroup = new Set<string>();
    const combosInGroup = new Set<string>();
    const attrDefs = new Map<string, { isColor: boolean; values: Map<string, string | undefined> }>();

    groupRows.forEach(({ raw, lineNumber }) => {
      const rowErrors: string[] = [];
      const variantSku = cell(raw, "Variant SKU");
      if (!variantSku) rowErrors.push("Missing Variant SKU.");
      if (variantSku && skusInGroup.has(variantSku)) rowErrors.push(`Duplicate Variant SKU "${variantSku}" within this product.`);
      skusInGroup.add(variantSku);

      const priceRaw = cell(raw, "Price");
      const price = Number(priceRaw);
      if (!priceRaw || Number.isNaN(price) || price < 0) rowErrors.push(`Invalid Price "${priceRaw}".`);

      const salePriceRaw = cell(raw, "Sale Price");
      const salePrice = salePriceRaw ? Number(salePriceRaw) : undefined;
      if (salePriceRaw && (Number.isNaN(salePrice) || (salePrice as number) < 0)) rowErrors.push(`Invalid Sale Price "${salePriceRaw}".`);

      const stockRaw = cell(raw, "Stock");
      const stock = Number(stockRaw);
      if (!stockRaw || !Number.isInteger(stock) || stock < 0) rowErrors.push(`Invalid Stock "${stockRaw}" — must be a whole number.`);

      const lowStockRaw = cell(raw, "Low Stock Alert");
      const lowStockThreshold = lowStockRaw ? Number(lowStockRaw) : 5;
      if (lowStockRaw && (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)) rowErrors.push(`Invalid Low Stock Alert "${lowStockRaw}".`);

      const attributeValues = parseAttributesCell(cell(raw, "Attributes"), cell(raw, "Colour Hex"));
      const key = comboKey(attributeValues);
      if (combosInGroup.has(key)) {
        rowErrors.push(
          attributeValues.length > 0
            ? `Duplicate combination: ${attributeValues.map((a) => a.value).join(" / ")} is used by more than one row.`
            : "Only one variant is allowed when no attributes are set."
        );
      }
      combosInGroup.add(key);

      attributeValues.forEach((a) => {
        if (!attrDefs.has(a.name)) attrDefs.set(a.name, { isColor: COLOR_NAME.test(a.name) || Boolean(a.hex), values: new Map() });
        attrDefs.get(a.name)!.values.set(a.value, a.hex ?? attrDefs.get(a.name)!.values.get(a.value));
      });

      variantDrafts.push({ lineNumber, sku: variantSku, errors: rowErrors });
      if (rowErrors.length === 0) {
        variants.push({
          sku: variantSku,
          barcode: cellOrUndefined(raw, "Barcode"),
          attributeValues,
          price,
          salePrice,
          stock,
          lowStockThreshold,
        });
      }
    });

    if (groupRows.length === 0) errors.push("No variant rows found for this Product SKU.");

    const variantAttributes: ProductInput["variantAttributes"] = [...attrDefs.entries()].map(([defName, def], position) => ({
      name: defName,
      isColor: def.isColor,
      position,
      values: [...def.values.entries()].map(([value, hex]) => ({ value, hex })),
    }));

    const input: ProductInput = {
      name,
      slug,
      sku: productSku,
      categoryId: category?.id ?? "",
      brandId: brand?.id,
      description,
      shortDescription: cellOrUndefined(resolved, "Short Description"),
      gender: gender as ProductInput["gender"],
      material: resolved["Material"] || undefined,
      fitInfo: resolved["Fit Info"] || undefined,
      careInstructions: resolved["Care Instructions"] || undefined,
      tags: resolved["Tags"] ? resolved["Tags"].split(";").map((t) => t.trim()).filter(Boolean).join(",") : undefined,
      status: status as ProductInput["status"],
      isFeatured: false,
      images,
      collectionSlugs: [],
      variantAttributes,
      variants,
    };

    return {
      productSku,
      lineNumbers: groupRows.map((r) => r.lineNumber),
      input,
      variantDrafts,
      errors,
      warnings,
      mode: "create",
    };
  });

  return { groups, unassignedRowErrors };
}

/** Annotates parsed groups with create-vs-update mode and cross-product SKU conflicts, using the
 * batched DB lookup from checkImportConflicts(). A SKU already owned by a different product is a
 * hard error — a variant is never silently reassigned between products via import. */
export function applyConflicts(groups: ProductGroup[], lookup: ImportLookup): ProductGroup[] {
  const existingProductSkus = new Set(lookup.existingProductSkus);
  const ownerByVariantSku = new Map(lookup.variantOwners.map((o) => [o.variantSku, o]));

  return groups.map((g) => {
    const errors = [...g.errors];
    const mode: "create" | "update" = existingProductSkus.has(g.productSku) ? "update" : "create";

    for (const v of g.input.variants) {
      const owner = ownerByVariantSku.get(v.sku);
      if (owner && owner.productSku !== g.productSku) {
        errors.push(`Variant SKU "${v.sku}" already belongs to a different product ("${owner.productSku}") — can't be reassigned via import.`);
      }
    }

    return { ...g, mode, errors };
  });
}
