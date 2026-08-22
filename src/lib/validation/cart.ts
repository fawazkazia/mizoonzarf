import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const updateCartItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(0).max(20),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1),
});
