"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { productInputSchema, type ProductInput } from "@/lib/validation/admin-product";
import { notifyWishlistersOfProduct } from "@/lib/notifications/inapp";
import { generateCode128 } from "@/lib/barcode/generate";
import { getDefaultWarehouseId } from "@/lib/inventory/stock";
import type { Prisma } from "@/generated/prisma/client";

/** New product/variant: keep an admin-typed code as a manufacturer barcode, otherwise auto-generate one. */
async function variantBarcodeFields(tx: Prisma.TransactionClient, typed?: string) {
  const trimmed = typed?.trim();
  if (trimmed) return { barcode: trimmed, barcodeType: "CODE128" as const, barcodeSource: "MANUFACTURER" as const, barcodeGeneratedAt: new Date() };
  return { barcode: await generateCode128(tx), barcodeType: "CODE128" as const, barcodeSource: "GENERATED" as const, barcodeGeneratedAt: new Date() };
}

function friendlyBarcodeError(err: unknown): never {
  if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
    throw new Error("One of the barcodes entered is already assigned to another variant.");
  }
  throw err as Error;
}

function toTags(input?: string): string[] {
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

function baseProductData(input: ProductInput) {
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

function revalidateProductPaths(slug?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/");
  if (slug) revalidatePath(`/product/${slug}`);
}

export async function createProduct(raw: ProductInput) {
  await requireStaff();
  const input = productInputSchema.parse(raw);

  const existingSku = await db.product.findUnique({ where: { sku: input.sku } });
  if (existingSku) throw new Error(`SKU "${input.sku}" is already in use.`);
  const existingSlug = await db.product.findUnique({ where: { slug: input.slug } });
  if (existingSlug) throw new Error(`Slug "${input.slug}" is already in use.`);

  const product = await db.$transaction(async (tx) => {
    const variantsData = await Promise.all(
      input.variants.map(async (v) => ({
        sku: v.sku,
        ...(await variantBarcodeFields(tx, v.barcode)),
        size: v.size || null,
        color: v.color || null,
        colorHex: v.colorHex || null,
        price: v.price,
        salePrice: v.salePrice || null,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
      }))
    );

    let created;
    try {
      created = await tx.product.create({
        data: {
          ...baseProductData(input),
          collections: { connect: input.collectionSlugs.map((slug) => ({ slug })) },
          images: {
            create: input.images.map((url, i) => ({ url, sortOrder: i, isPrimary: i === 0 })),
          },
          variants: { create: variantsData },
        },
        include: { variants: true },
      });
    } catch (err) {
      friendlyBarcodeError(err);
    }

    // Give every new variant an initial per-warehouse stock row so Inventory's warehouse
    // breakdown always sums back to the variant's total — otherwise a variant created here
    // would show its stock in the total but nowhere in any specific warehouse.
    try {
      const warehouseId = await getDefaultWarehouseId(tx);
      await tx.variantWarehouseStock.createMany({
        data: created.variants.map((v) => ({ variantId: v.id, warehouseId, quantity: v.stock })),
      });
    } catch {
      // No warehouse configured yet — inventory tracking is additive, so this must never block product creation.
    }

    return created;
  });

  revalidateProductPaths(product.slug);
  return { id: product.id };
}

export async function updateProduct(id: string, raw: ProductInput) {
  await requireStaff();
  const input = productInputSchema.parse(raw);

  const conflictSku = await db.product.findFirst({ where: { sku: input.sku, id: { not: id } } });
  if (conflictSku) throw new Error(`SKU "${input.sku}" is already in use.`);
  const conflictSlug = await db.product.findFirst({ where: { slug: input.slug, id: { not: id } } });
  if (conflictSlug) throw new Error(`Slug "${input.slug}" is already in use.`);

  const existingVariants = await db.productVariant.findMany({
    where: { productId: id },
    select: { id: true, stock: true, price: true, salePrice: true, barcode: true },
  });
  const keepIds = new Set(input.variants.map((v) => v.id).filter(Boolean));
  const toDelete = existingVariants.filter((v) => !keepIds.has(v.id)).map((v) => v.id);
  const existingById = new Map(existingVariants.map((v) => [v.id, v]));

  let restocked = false;
  let priceDropped = false;
  for (const v of input.variants) {
    const prev = v.id ? existingById.get(v.id) : undefined;
    if (!prev) continue;
    if (prev.stock <= 0 && v.stock > 0) restocked = true;
    const prevEffective = Number(prev.salePrice ?? prev.price);
    const nextEffective = Number(v.salePrice ?? v.price);
    if (nextEffective < prevEffective) priceDropped = true;
  }

  try {
    await db.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const v of input.variants) {
        const common = {
          sku: v.sku,
          size: v.size || null,
          color: v.color || null,
          colorHex: v.colorHex || null,
          price: v.price,
          salePrice: v.salePrice || null,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
        };
        if (v.id) {
          // Existing variant: only touch barcode fields if the admin actually typed a new value —
          // leave a previously generated/assigned barcode alone otherwise (never silently replace it).
          const prev = existingById.get(v.id);
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
          // Same as createProduct: seed an initial per-warehouse row so the warehouse breakdown
          // doesn't silently fall out of sync with this variant's total stock.
          try {
            const warehouseId = await getDefaultWarehouseId(tx);
            await tx.variantWarehouseStock.create({ data: { variantId: newVariant.id, warehouseId, quantity: newVariant.stock } });
          } catch {
            // No warehouse configured yet — must never block saving the product.
          }
        }
      }

      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: input.images.map((url, i) => ({ productId: id, url, sortOrder: i, isPrimary: i === 0 })),
      });

      await tx.product.update({
        where: { id },
        data: {
          ...baseProductData(input),
          collections: { set: input.collectionSlugs.map((slug) => ({ slug })) },
        },
      });
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

  revalidateProductPaths(input.slug);
  return { id };
}

export async function deleteProduct(id: string) {
  await requireStaff();
  const orderItemCount = await db.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) {
    throw new Error("This product has existing orders and can't be deleted. Archive it instead.");
  }
  const product = await db.product.delete({ where: { id } });
  revalidateProductPaths(product.slug);
}

export async function duplicateProduct(id: string) {
  await requireStaff();
  const product = await db.product.findUnique({ where: { id }, include: { images: true, variants: true, collections: true } });
  if (!product) throw new Error("Product not found.");

  const suffix = Math.random().toString(36).slice(2, 6);
  const created = await db.$transaction(async (tx) => {
    const copy = await tx.product.create({
      data: {
        name: `${product.name} (Copy)`,
        slug: `${product.slug}-copy-${suffix}`,
        sku: `${product.sku}-${suffix}`.toUpperCase(),
        categoryId: product.categoryId,
        brandId: product.brandId,
        description: product.description,
        shortDescription: product.shortDescription,
        videoUrl: product.videoUrl,
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        gender: product.gender,
        material: product.material,
        fitInfo: product.fitInfo,
        careInstructions: product.careInstructions,
        sizeGuideType: product.sizeGuideType,
        fragranceFamily: product.fragranceFamily,
        fragranceNotes: product.fragranceNotes ?? undefined,
        concentration: product.concentration,
        tags: product.tags,
        gstRate: product.gstRate,
        hsnCode: product.hsnCode,
        status: "DRAFT",
        collections: { connect: product.collections.map((c) => ({ slug: c.slug })) },
        images: { create: product.images.map((img) => ({ url: img.url, altText: img.altText, sortOrder: img.sortOrder, isPrimary: img.isPrimary })) },
        variants: {
          create: product.variants.map((v, i) => ({
            sku: `${v.sku}-${suffix}-${i}`,
            // Barcodes must be unique per variant — never carry the original's over; the
            // duplicate shows up as "missing barcode" in Inventory until one is generated.
            barcode: null,
            barcodeType: null,
            barcodeSource: null,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
            salePrice: v.salePrice,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold,
          })),
        },
      },
      include: { variants: true },
    });

    try {
      const warehouseId = await getDefaultWarehouseId(tx);
      await tx.variantWarehouseStock.createMany({
        data: copy.variants.map((v) => ({ variantId: v.id, warehouseId, quantity: v.stock })),
      });
    } catch {
      // No warehouse configured yet — must never block duplicating a product.
    }

    return copy;
  });

  revalidateProductPaths();
  return { id: created.id };
}
