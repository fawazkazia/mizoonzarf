"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { couponInputSchema, promotionInputSchema, type CouponInput, type PromotionInput } from "@/lib/validation/admin-promotion";

function revalidatePromotionPaths() {
  revalidatePath("/admin/promotions");
  revalidatePath("/");
  revalidatePath("/cart");
}

export async function createCoupon(raw: CouponInput) {
  const session = await requirePermission("marketing.manageCoupons");
  const input = couponInputSchema.parse(raw);
  const code = input.code.trim().toUpperCase();

  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) throw new Error(`Coupon code "${code}" already exists.`);

  const skus = input.productSkus.map((s) => s.trim()).filter(Boolean);
  const emails = input.customerEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);

  const [products, customers] = await Promise.all([
    skus.length ? db.product.findMany({ where: { sku: { in: skus } }, select: { id: true, sku: true } }) : Promise.resolve([]),
    emails.length ? db.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } }) : Promise.resolve([]),
  ]);

  const missingSkus = skus.filter((sku) => !products.some((p) => p.sku === sku));
  if (missingSkus.length > 0) throw new Error(`No product found for SKU(s): ${missingSkus.join(", ")}`);

  const missingEmails = emails.filter((email) => !customers.some((c) => c.email.toLowerCase() === email));
  if (missingEmails.length > 0) throw new Error(`No customer account found for: ${missingEmails.join(", ")}`);

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
      categorySlugs: input.categorySlugs,
      productIds: products.map((p) => p.id),
      customerIds: customers.map((c) => c.id),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive,
    },
  });
  await logStaffActivity({ actorId: session.user.id, action: "COUPON_CREATED", module: "marketing", entityType: "Coupon", entityId: code, after: { code, discountType: input.discountType, discountValue: input.discountValue } });
  revalidatePromotionPaths();
}

export async function toggleCoupon(code: string, isActive: boolean) {
  const session = await requirePermission("marketing.manageCoupons");
  await db.coupon.update({ where: { code }, data: { isActive } });
  await logStaffActivity({ actorId: session.user.id, action: "COUPON_TOGGLED", module: "marketing", entityType: "Coupon", entityId: code, after: { isActive } });
  revalidatePromotionPaths();
}

export async function deleteCoupon(code: string) {
  const session = await requirePermission("marketing.manageCoupons");
  await db.coupon.delete({ where: { code } });
  await logStaffActivity({ actorId: session.user.id, action: "COUPON_DELETED", module: "marketing", entityType: "Coupon", entityId: code });
  revalidatePromotionPaths();
}

export async function createPromotion(raw: PromotionInput) {
  const session = await requirePermission("marketing.createCampaigns");
  const input = promotionInputSchema.parse(raw);

  const promotion = await db.promotion.create({
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
  await logStaffActivity({ actorId: session.user.id, action: "PROMOTION_CREATED", module: "marketing", entityType: "Promotion", entityId: promotion.id, after: { name: input.name } });
  revalidatePromotionPaths();
}

export async function togglePromotion(id: string, isActive: boolean) {
  const session = await requirePermission("marketing.editCampaigns");
  await db.promotion.update({ where: { id }, data: { isActive } });
  await logStaffActivity({ actorId: session.user.id, action: "PROMOTION_TOGGLED", module: "marketing", entityType: "Promotion", entityId: id, after: { isActive } });
  revalidatePromotionPaths();
}

export async function deletePromotion(id: string) {
  const session = await requirePermission("marketing.editCampaigns");
  await db.promotion.delete({ where: { id } });
  await logStaffActivity({ actorId: session.user.id, action: "PROMOTION_DELETED", module: "marketing", entityType: "Promotion", entityId: id });
  revalidatePromotionPaths();
}
