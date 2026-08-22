import { z } from "zod";

export const collectionInputSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  productIds: z.array(z.string()).default([]),
});

export type CollectionInput = z.infer<typeof collectionInputSchema>;
