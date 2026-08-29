import { z } from "zod";

export const variantAttrInputSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  hex: z.string().optional(),
});

export const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "Variant SKU is required"),
  barcode: z.string().optional(),
  // Legacy mirror fields — always recomputed server-side from attributeValues, never trusted from the client.
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  attributeValues: z.array(variantAttrInputSchema).default([]),
  price: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
});

export const variantAttributeDefInputSchema = z.object({
  name: z.string().min(1),
  isColor: z.boolean().default(false),
  position: z.number().default(0),
  values: z.array(z.object({ value: z.string().min(1), hex: z.string().optional() })).default([]),
});

export const productInputSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional(),
  videoUrl: z.string().optional(),
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]),
  material: z.string().optional(),
  fitInfo: z.string().optional(),
  careInstructions: z.string().optional(),
  sizeGuideType: z.string().optional(),
  fragranceFamily: z.string().optional(),
  fragranceTopNotes: z.string().optional(),
  fragranceHeartNotes: z.string().optional(),
  fragranceBaseNotes: z.string().optional(),
  concentration: z.string().optional(),
  tags: z.string().optional(),
  gstRate: z.coerce.number().min(0).max(100).optional().nullable(),
  hsnCode: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.array(z.string()).default([]),
  collectionSlugs: z.array(z.string()).default([]),
  variantAttributes: z.array(variantAttributeDefInputSchema).default([]),
  variants: z.array(variantInputSchema).min(1, "At least one variant is required"),
});

export type ProductInput = z.infer<typeof productInputSchema>;
