"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { couponInputSchema, promotionInputSchema, type CouponInput, type PromotionInput } from "@/lib/validation/admin-promotion";

function revalidatePromotionPaths() {
  revalidatePath("/admin/promotions");
  revalidatePath("/");
  revalidatePath("/cart");
}

export async function createCoupon(raw: CouponInput) {
  await requireStaff();
  const input = couponInputSchema.parse(raw);
  const code = input.code.trim().toUpperCase();

  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) throw new Error(`Coupon code "${code}" already exists.`);

  await db.coupon.create({
    data: {
      code,
      description: input.description || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderValue: input.minOrderValue ?? null,
      maxDiscountAmount: input.maxDiscountAmount ?? null,
      usageLimit: input.usageLimit ?? null,
      perCustomerLimit: input.perCustomerLimit ?? null,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive,
    },
  });
  revalidatePromotionPaths();
}

export async function toggleCoupon(code: string, isActive: boolean) {
  await requireStaff();
  await db.coupon.update({ where: { code }, data: { isActive } });
  revalidatePromotionPaths();
}

export async function deleteCoupon(code: string) {
  await requireStaff();
  await db.coupon.delete({ where: { code } });
  revalidatePromotionPaths();
}

export async function createPromotion(raw: PromotionInput) {
  await requireStaff();
  const input = promotionInputSchema.parse(raw);

  await db.promotion.create({
    data: {
      name: input.name,
      type: input.type,
      discountType: input.discountType,
      discountValue: input.discountValue,
      categorySlugs: input.categorySlugs,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive,
      bannerText: input.bannerText || null,
    },
  });
  revalidatePromotionPaths();
}

export async function togglePromotion(id: string, isActive: boolean) {
  await requireStaff();
  await db.promotion.update({ where: { id }, data: { isActive } });
  revalidatePromotionPaths();
}

export async function deletePromotion(id: string) {
  await requireStaff();
  await db.promotion.delete({ where: { id } });
  revalidatePromotionPaths();
}
