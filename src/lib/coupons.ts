import { db } from "@/lib/db";

/**
 * Best active coupon to feature in storefront promo UI (e.g. the PDP coupon
 * banner). Prefers coupons with no minimum order value — those are always
 * usable regardless of the product being viewed — before falling back to
 * the highest-value coupon that does have one.
 */
export async function getFeaturedCoupon() {
  const now = new Date();
  const active = await db.coupon.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { discountValue: "desc" },
  });
  return active.find((c) => c.minOrderValue === null) ?? active[0] ?? null;
}
