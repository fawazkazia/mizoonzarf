import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(10, "Please write at least 10 characters").max(2000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
