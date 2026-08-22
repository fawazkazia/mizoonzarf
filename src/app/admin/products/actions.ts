"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { productInputSchema, type ProductInput } from "@/lib/validation/admin-product";

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

  const product = await db.product.create({
    data: {
      ...baseProductData(input),
      collections: { connect: input.collectionSlugs.map((slug) => ({ slug })) },
      images: {
        create: input.images.map((url, i) => ({ url, sortOrder: i, isPrimary: i === 0 })),
      },
      variants: {
        create: input.variants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode || null,
          size: v.size || null,
          color: v.color || null,
          colorHex: v.colorHex || null,
          price: v.price,
          salePrice: v.salePrice || null,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
        })),
      },
    },
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

  const existingVariants = await db.productVariant.findMany({ where: { productId: id }, select: { id: true } });
  const keepIds = new Set(input.variants.map((v) => v.id).filter(Boolean));
  const toDelete = existingVariants.filter((v) => !keepIds.has(v.id)).map((v) => v.id);

  await db.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const v of input.variants) {
      const data = {
        sku: v.sku,
        barcode: v.barcode || null,
        size: v.size || null,
        color: v.color || null,
        colorHex: v.colorHex || null,
        price: v.price,
        salePrice: v.salePrice || null,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
      };
      if (v.id) {
        await tx.productVariant.update({ where: { id: v.id }, data });
      } else {
        await tx.productVariant.create({ data: { ...data, productId: id } });
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
  const created = await db.product.create({
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
      status: "DRAFT",
      collections: { connect: product.collections.map((c) => ({ slug: c.slug })) },
      images: { create: product.images.map((img) => ({ url: img.url, altText: img.altText, sortOrder: img.sortOrder, isPrimary: img.isPrimary })) },
      variants: {
        create: product.variants.map((v, i) => ({
          sku: `${v.sku}-${suffix}-${i}`,
          barcode: v.barcode,
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
  });

  revalidateProductPaths();
  return { id: created.id };
}
