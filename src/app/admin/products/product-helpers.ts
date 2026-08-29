import { revalidatePath } from "next/cache";
import { comboKey } from "@/lib/inventory/variant-attributes";
import type { ProductInput } from "@/lib/validation/admin-product";

/**
 * Pure/sync helpers shared by the manual-form write path (actions.ts) and the CSV importer
 * (import-actions.ts). Kept in a plain module deliberately: files marked "use server" may only
 * export async functions (Next.js's Server Actions constraint applies to every export in such a
 * file), so these can't live alongside createProduct/updateProduct despite being tightly related.
 */

export function friendlyBarcodeError(err: unknown): never {
  if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
    throw new Error("One of the barcodes entered is already assigned to another variant.");
  }
  throw err as Error;
}

export function assertNoDuplicateCombos(variants: ProductInput["variants"]) {
  const seen = new Set<string>();
  for (const v of variants) {
    const key = comboKey(v.attributeValues);
    if (seen.has(key)) {
      throw new Error(
        v.attributeValues.length > 0
          ? `Duplicate variant: ${v.attributeValues.map((a) => a.value).join(" / ")} is used by more than one row.`
          : "Only one variant is allowed when no attributes are set."
      );
    }
    seen.add(key);
  }
}

export function toTags(input?: string): string[] {
  if (!input) return [];
  return [...new Set(input.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

function toNoteList(input?: string): string[] | undefined {
  if (!input) return undefined;
  const list = input.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

function buildFragranceNotes(input: ProductInput) {
  const notes = {
    top: toNoteList(input.fragranceTopNotes),
    heart: toNoteList(input.fragranceHeartNotes),
    base: toNoteList(input.fragranceBaseNotes),
  };
  return notes.top || notes.heart || notes.base ? notes : undefined;
}

export function baseProductData(input: ProductInput) {
  const prices = input.variants.map((v) => v.price);
  return {
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    categoryId: input.categoryId,
    brandId: input.brandId || null,
    description: input.description,
    shortDescription: input.shortDescription || null,
    videoUrl: input.videoUrl || null,
    basePrice: Math.min(...prices),
    gender: input.gender,
    material: input.material || null,
    fitInfo: input.fitInfo || null,
    careInstructions: input.careInstructions || null,
    sizeGuideType: input.sizeGuideType || null,
    fragranceFamily: input.fragranceFamily || null,
    fragranceNotes: buildFragranceNotes(input),
    concentration: input.concentration || null,
    tags: toTags(input.tags),
    gstRate: input.gstRate ?? null,
    hsnCode: input.hsnCode || null,
    status: input.status,
    isFeatured: input.isFeatured,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
  };
}

export function revalidateProductPaths(slug?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/");
  if (slug) revalidatePath(`/product/${slug}`);
}
