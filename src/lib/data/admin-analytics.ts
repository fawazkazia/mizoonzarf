import { db } from "@/lib/db";
import { countAbandonedCarts } from "./abandoned-carts";
import type { AnalyticsRange } from "./date-presets";

export type { AnalyticsRange } from "./date-presets";

type Granularity = "day" | "week" | "month";

function resolveGranularity(from: Date, to: Date): Granularity {
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days <= 31) return "day";
  if (days <= 180) return "week";
  return "month";
}

function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "day") return date.toISOString().slice(0, 10);
  if (granularity === "month") return date.toISOString().slice(0, 7);
  const d = new Date(date);
  const dayIndex = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dayIndex);
  return d.toISOString().slice(0, 10);
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return new Date(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildBucketKeys(from: Date, to: Date, granularity: Granularity): string[] {
  const keys: string[] = [];
  const cursor = new Date(from);
  const step = granularity === "day" ? 1 : granularity === "week" ? 7 : 0;
  while (cursor <= to) {
    const key = bucketKey(cursor, granularity);
    if (keys[keys.length - 1] !== key) keys.push(key);
    if (granularity === "month") cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + step);
  }
  return keys;
}

export async function getAnalytics({ from, to }: AnalyticsRange) {
  const granularity = resolveGranularity(from, to);
  const bucketKeys = buildBucketKeys(from, to, granularity);

  const [orders, statusGroups, items, newCustomers, abandonedCartCount] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }),
    db.order.groupBy({ by: ["status"], where: { createdAt: { gte: from, lte: to } }, _count: true }),
    db.orderItem.findMany({
      where: { order: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } } },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        subtotal: true,
        product: { select: { slug: true, category: { select: { id: true, name: true } } } },
      },
    }),
    db.user.findMany({ where: { role: "CUSTOMER", createdAt: { gte: from, lte: to } }, select: { createdAt: true } }),
    countAbandonedCarts(from, to),
  ]);

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const orderCount = orders.length;

  const revenueBuckets = new Map(bucketKeys.map((k) => [k, 0]));
  for (const order of orders) {
    const key = bucketKey(order.createdAt, granularity);
    if (revenueBuckets.has(key)) revenueBuckets.set(key, (revenueBuckets.get(key) ?? 0) + Number(order.total));
  }

  const customerBuckets = new Map(bucketKeys.map((k) => [k, 0]));
  for (const user of newCustomers) {
    const key = bucketKey(user.createdAt, granularity);
    if (customerBuckets.has(key)) customerBuckets.set(key, (customerBuckets.get(key) ?? 0) + 1);
  }

  const productTotals = new Map<string, { name: string; slug: string; revenue: number; quantity: number }>();
  const categoryTotals = new Map<string, { name: string; revenue: number }>();
  for (const item of items) {
    const p = productTotals.get(item.productId) ?? { name: item.productName, slug: item.product.slug, revenue: 0, quantity: 0 };
    p.revenue += Number(item.subtotal);
    p.quantity += item.quantity;
    productTotals.set(item.productId, p);

    const category = item.product.category;
    if (category) {
      const c = categoryTotals.get(category.id) ?? { name: category.name, revenue: 0 };
      c.revenue += Number(item.subtotal);
      categoryTotals.set(category.id, c);
    }
  }

  return {
    revenue,
    orderCount,
    avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
    abandonedCartCount,
    conversionRate: orderCount + abandonedCartCount > 0 ? orderCount / (orderCount + abandonedCartCount) : 0,
    revenueTrend: bucketKeys.map((key) => ({ date: bucketLabel(key, granularity), total: revenueBuckets.get(key) ?? 0 })),
    customerGrowth: bucketKeys.map((key) => ({ date: bucketLabel(key, granularity), count: customerBuckets.get(key) ?? 0 })),
    ordersByStatus: statusGroups.map((g) => ({ status: g.status.replace(/_/g, " "), count: g._count })),
    topProducts: [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    topCategories: [...categoryTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
  };
}

