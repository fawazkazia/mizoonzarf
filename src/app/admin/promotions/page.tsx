import { db } from "@/lib/db";
import { CouponManager } from "./CouponManager";
import { PromotionManager } from "./PromotionManager";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  const [coupons, promotions, categories] = await Promise.all([
    db.coupon.findMany({ orderBy: { startDate: "desc" } }),
    db.promotion.findMany({ orderBy: { startDate: "desc" } }),
    db.category.findMany({ where: { parentId: null }, select: { slug: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl">Promotions</h1>
        <p className="mt-1 text-sm text-ink-soft">Coupons apply at checkout. Promotions power the homepage flash sale section.</p>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl">Coupons</h2>
        <CouponManager
          coupons={coupons.map((c) => ({
            code: c.code,
            description: c.description,
            discountType: c.discountType,
            discountValue: Number(c.discountValue),
            usageCount: c.usageCount,
            usageLimit: c.usageLimit,
            categorySlugs: c.categorySlugs,
            productIds: c.productIds,
            customerIds: c.customerIds,
            startDate: c.startDate.toISOString(),
            endDate: c.endDate.toISOString(),
            isActive: c.isActive,
          }))}
          categoryOptions={categories}
        />
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl">Promotions</h2>
        <PromotionManager
          promotions={promotions.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            discountType: p.discountType,
            discountValue: Number(p.discountValue),
            categorySlugs: p.categorySlugs,
            startDate: p.startDate.toISOString(),
            endDate: p.endDate.toISOString(),
            isActive: p.isActive,
          }))}
          categoryOptions={categories}
        />
      </div>
    </div>
  );
}
