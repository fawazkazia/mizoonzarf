import { db } from "@/lib/db";
import type { DiscountType } from "@/generated/prisma/client";

export type ActiveOffer =
  | { kind: "coupon"; code: string; title: string; description: string | null; discountType: DiscountType; discountValue: number }
  | { kind: "promotion"; id: string; title: string; description: string | null; discountType: DiscountType; discountValue: number };

/** Active coupons + promotions for storefront "offers" surfaces (e.g. the
 * checkout Offers For You rail). Interleaves the two sources so neither one
 * crowds out the other, then trims to `limit`. */
export async function getActiveOffers(limit = 8): Promise<ActiveOffer[]> {
  const now = new Date();
  const activeWindow = { isActive: true, startDate: { lte: now }, endDate: { gte: now } };

  const [coupons, promotions] = await Promise.all([
    db.coupon.findMany({ where: activeWindow, orderBy: { discountValue: "desc" }, take: limit }),
    db.promotion.findMany({ where: activeWindow, orderBy: { discountValue: "desc" }, take: limit }),
  ]);

  const couponOffers: ActiveOffer[] = coupons.map((c) => ({
    kind: "coupon",
    code: c.code,
    title: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
  }));

  const promotionOffers: ActiveOffer[] = promotions.map((p) => ({
    kind: "promotion",
    id: p.id,
    title: p.name,
    description: p.bannerText,
    discountType: p.discountType,
    discountValue: Number(p.discountValue),
  }));

  const offers: ActiveOffer[] = [];
  const max = Math.max(couponOffers.length, promotionOffers.length);
  for (let i = 0; i < max; i++) {
    if (couponOffers[i]) offers.push(couponOffers[i]);
    if (promotionOffers[i]) offers.push(promotionOffers[i]);
  }

  return offers.slice(0, limit);
}
