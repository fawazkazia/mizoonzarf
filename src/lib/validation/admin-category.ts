import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX", ""]).optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  showInMenu: z.boolean().default(true),
  isActive: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
