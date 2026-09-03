"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { productInputSchema, type ProductInput } from "@/lib/validation/admin-product";
import { notifyWishlistersOfProduct } from "@/lib/notifications/inapp";
import { getDefaultWarehouseId } from "@/lib/inventory/stock";
import { deriveMirrorFields, parseAttributeValues, comboKey, mergeValues, type LibValue } from "@/lib/inventory/variant-attributes";
import { addAttributeLibraryValues } from "./attribute-library-actions";
import { createProduct, variantBarcodeFields } from "./actions";
import { assertNoDuplicateCombos, friendlyBarcodeError, baseProductData, toTags, revalidateProductPaths } from "./product-helpers";
import type { ImportLookup } from "./import/parse";
import type { Prisma } from "@/generated/prisma/client";

export interface ImportRowResult {
  status: "created" | "updated";
  productId: string;
  sku: string;
}

/**
 * Imports one product (its Product SKU + all of its variant rows from the CSV). Creates go
 * through createProduct() completely unchanged. Updates use a merge-safe path that never
 * deletes a variant the CSV didn't mention, never blanks a scalar field the CSV left empty,
 * and never touches an attribute axis (or collection, or fields outside the CSV schema like
 * gstRate/isFeatured/SEO) the file doesn't reference at all — bulk import must never destroy
 * data it didn't explicitly provide.
 */
export async function importProductRow(raw: ProductInput): Promise<ImportRowResult> {
  const input = productInputSchema.parse(raw);

  // Which permission applies depends on whether this row creates or updates a product — resolve
  // that first (a read-only SKU lookup) so the gate below checks the right one; createProduct()
  // re-checks "products.add" internally when it runs, which is already satisfied by this gate.
  const existing = await db.product.findUnique({ where: { sku: input.sku } });
  const session = await requirePermission(existing ? "products.edit" : "products.add");
  if (!existing) {
    const { id } = await createProduct(input);
    return { status: "created", productId: id, sku: input.sku };
  }

  const id = existing.id;

  const conflictSku = await db.product.findFirst({ where: { sku: input.sku, id: { not: id } } });
  if (conflictSku) throw new Error(`SKU "${input.sku}" is already in use.`);
  const conflictSlug = await db.product.findFirst({ where: { slug: input.slug, id: { not: id } } });
  if (conflictSlug) throw new Error(`Slug "${input.slug}" is already in use.`);

  assertNoDuplicateCombos(input.variants);

  const existingVariants = await db.productVariant.findMany({
    where: { productId: id },
    select: { id: true, sku: true, stock: true, price: true, salePrice: true, barcode: true, attributeValues: true },
  });
  const existingBySku = new Map(existingVariants.map((v) => [v.sku, v]));
  const submittedSkus = new Set(input.variants.map((v) => v.sku));

  // Never trust a client-submitted id for CSV input — resolve it server-side from SKU instead.
  const resolvedVariants = input.variants.map((v) => ({ ...v, id: existingBySku.get(v.sku)?.id }));

  // assertNoDuplicateCombos only checks within the submitted rows — also guard against a
  // submitted variant colliding with an existing variant this file doesn't touch at all.
  const untouched = existingVariants.filter((v) => !submittedSkus.has(v.sku));
  const untouchedCombos = new Set(untouched.map((v) => comboKey(parseAttributeValues(v.attributeValues))));
  for (const v of resolvedVariants) {
    if (untouchedCombos.has(comboKey(v.attributeValues))) {
      throw new Error(
        v.attributeValues.length > 0
          ? `Duplicate variant: ${v.attributeValues.map((a) => a.value).join(" / ")} already exists on this product.`
          : "This product already has a variant with no attributes."
      );
    }
  }

  // basePrice must reflect every variant that will exist after the write, not just the rows this
  // file happens to submit — an untouched variant may hold the true lowest price.
  const basePrice = Math.min(...untouched.map((v) => Number(v.price)), ...resolvedVariants.map((v) => v.price));

  let restocked = false;
  let priceDropped = false;
  for (const v of resolvedVariants) {
    const prev = v.id ? existingBySku.get(v.sku) : undefined;
    if (!prev) continue;
    if (Number(prev.stock) <= 0 && v.stock > 0) restocked = true;
    const prevEffective = Number(prev.salePrice ?? prev.price);
    const nextEffective = Number(v.salePrice ?? v.price);
    if (nextEffective < prevEffective) priceDropped = true;
  }

  const base = baseProductData(input);
  // Explicit key inclusion, not a spread of baseProductData(): a blank CSV cell parses to
  // `undefined`, and anything the CSV schema doesn't cover at all (gstRate, isFeatured, SEO
  // fields, collections, ...) is always undefined too — both must leave the existing DB value
  // alone rather than being coerced to null/false/[] by baseProductData()'s defaults.
  const updateData: Prisma.ProductUpdateInput = {
    name: base.name,
    slug: base.slug,
    sku: base.sku,
    category: { connect: { id: input.categoryId } },
    description: base.description,
    gender: base.gender,
    status: base.status,
    basePrice,
  };
  if (input.brandId !== undefined) updateData.brand = { connect: { id: input.brandId } };
  if (input.shortDescription !== undefined) updateData.shortDescription = input.shortDescription;
  if (input.material !== undefined) updateData.material = input.material;
  if (input.fitInfo !== undefined) updateData.fitInfo = input.fitInfo;
  if (input.careInstructions !== undefined) updateData.careInstructions = input.careInstructions;
  if (input.tags !== undefined) updateData.tags = toTags(input.tags);

  try {
    await db.$transaction(async (tx) => {
      for (const v of resolvedVariants) {
        const common = {
          sku: v.sku,
          attributeValues: v.attributeValues as unknown as Prisma.InputJsonValue,
          ...deriveMirrorFields(v.attributeValues),
          price: v.price,
          salePrice: v.salePrice || null,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
        };
        if (v.id) {
          const prev = existingBySku.get(v.sku);
          const typed = v.barcode?.trim();
          const barcodeFields =
            typed && typed !== prev?.barcode
              ? { barcode: typed, barcodeType: "CODE128" as const, barcodeSource: "MANUFACTURER" as const, barcodeGeneratedAt: new Date() }
              : {};
          await tx.productVariant.update({ where: { id: v.id }, data: { ...common, ...barcodeFields } });
        } else {
          const newVariant = await tx.productVariant.create({
            data: { ...common, ...(await variantBarcodeFields(tx, v.barcode)), productId: id },
          });
          try {
            const warehouseId = await getDefaultWarehouseId(tx);
            await tx.variantWarehouseStock.create({ data: { variantId: newVariant.id, warehouseId, quantity: newVariant.stock } });
          } catch {
            // No warehouse configured yet — must never block the import.
          }
        }
      }

      // Images: only touch when the CSV actually listed some for this product's first row.
      if (input.images.length > 0) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: input.images.map((url, i) => ({ productId: id, url, sortOrder: i, isPrimary: i === 0 })),
        });
      }

      // Attribute defs: merge each axis this file touches into its existing value pool; any
      // existing axis the file never mentions (e.g. a Fit axis this CSV doesn't reference) is
      // left completely alone, and isColor is never flipped by an import.
      if (input.variantAttributes.length > 0) {
        const existingDefs = await tx.productVariantAttribute.findMany({ where: { productId: id } });
        const existingDefsByName = new Map(existingDefs.map((d) => [d.name, d]));
        for (const def of input.variantAttributes) {
          const existingDef = existingDefsByName.get(def.name);
          if (existingDef) {
            const merged = mergeValues((existingDef.values as unknown as LibValue[]) ?? [], def.values);
            await tx.productVariantAttribute.update({
              where: { id: existingDef.id },
              data: { values: merged as unknown as Prisma.InputJsonValue },
            });
          } else {
            await tx.productVariantAttribute.create({
              data: { productId: id, name: def.name, isColor: def.isColor, position: def.position, values: def.values as unknown as Prisma.InputJsonValue },
            });
          }
        }
      }

      await tx.product.update({ where: { id }, data: updateData });
    });
  } catch (err) {
    friendlyBarcodeError(err);
  }

  if (restocked) {
    await notifyWishlistersOfProduct(id, {
      type: "BACK_IN_STOCK",
      title: input.name,
      body: "An item on your wishlist is back in stock.",
      link: `/product/${input.slug}`,
    });
  }
  if (priceDropped) {
    await notifyWishlistersOfProduct(id, {
      type: "PRICE_DROP",
      title: input.name,
      body: "An item on your wishlist just dropped in price.",
      link: `/product/${input.slug}`,
    });
  }

  for (const def of input.variantAttributes) {
    try {
      await addAttributeLibraryValues(def.name, def.isColor, def.values);
    } catch {
      // Best effort — must never block the import.
    }
  }

  await logStaffActivity({ actorId: session.user.id, action: "PRODUCT_IMPORTED", module: "products", entityType: "Product", entityId: id, after: { name: input.name, sku: input.sku } });
  revalidateProductPaths(input.slug);
  return { status: "updated", productId: id, sku: input.sku };
}

/** One batched, read-only lookup backing preview validation — resolves create-vs-update mode
 * per product group and flags any Variant SKU that already belongs to a *different* product. */
export async function checkImportConflicts(productSkus: string[], variantSkus: string[]): Promise<ImportLookup> {
  await requirePermission("products.view");
  const [products, variants] = await Promise.all([
    productSkus.length > 0 ? db.product.findMany({ where: { sku: { in: productSkus } }, select: { sku: true } }) : Promise.resolve([]),
    variantSkus.length > 0
      ? db.productVariant.findMany({ where: { sku: { in: variantSkus } }, select: { sku: true, product: { select: { id: true, sku: true } } } })
      : Promise.resolve([]),
  ]);
  return {
    existingProductSkus: products.map((p) => p.sku),
    variantOwners: variants.map((v) => ({ variantSku: v.sku, productId: v.product.id, productSku: v.product.sku })),
  };
}
