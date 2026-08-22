import { z } from "zod";

export const couponInputSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  discountValue: z.coerce.number().min(0),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxDiscountAmount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  perCustomerLimit: z.coerce.number().int().min(1).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().default(true),
});
export type CouponInput = z.infer<typeof couponInputSchema>;

export const promotionInputSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["FLASH_SALE", "CATEGORY_SALE", "PRODUCT_SALE", "SEASONAL"]),
  discountType: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  discountValue: z.coerce.number().min(0),
  categorySlugs: z.array(z.string()).default([]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().default(true),
  bannerText: z.string().optional(),
});
export type PromotionInput = z.infer<typeof promotionInputSchema>;
