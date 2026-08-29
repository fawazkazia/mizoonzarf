import { db } from "@/lib/db";
import { getAbandonedCarts } from "./abandoned-carts";
import { formatVariantLabel } from "@/lib/inventory/variant-attributes";

export async function getDashboardStats() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [revenueAgg, orderCount, customerCount, productCount, lowStockRows, recentOrders, statusGroups, lowStockVariantRows, abandonedCarts, pendingReturnsCount] =
    await Promise.all([
      db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
      db.order.count({ where: { status: { not: "CANCELLED" } } }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.product.count({ where: { status: "ACTIVE" } }),
      db.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint as count FROM "product_variants" WHERE stock <= "lowStockThreshold"`,
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, orderNumber: true, total: true, status: true, paymentStatus: true, paymentMethod: true, createdAt: true, guestEmail: true, user: { select: { name: true, email: true } } } }),
      db.order.groupBy({ by: ["status"], _count: true }),
      db.$queryRaw<
        {
          id: string;
          sku: string;
          stock: number;
          lowStockThreshold: number;
          size: string | null;
          color: string | null;
          colorHex: string | null;
          attributeValues: unknown;
          productName: string;
          productSlug: string;
        }[]
      >`
        SELECT pv.id, pv.sku, pv.stock, pv."lowStockThreshold", pv.size, pv.color, pv."colorHex", pv."attributeValues", p.name as "productName", p.slug as "productSlug"
        FROM "product_variants" pv
        JOIN "products" p ON p.id = pv."productId"
        WHERE pv.stock <= pv."lowStockThreshold"
        ORDER BY pv.stock ASC
        LIMIT 8
      `,
      getAbandonedCarts(),
      db.return.count({ where: { status: { in: ["REQUESTED", "APPROVED", "PICKUP", "RECEIVED", "REFUND_PROCESSING"] } } }),
    ]);

  const ordersInWindow = await db.order.findMany({
    where: { createdAt: { gte: fourteenDaysAgo }, status: { not: "CANCELLED" } },
    select: { createdAt: true, total: true },
  });

  const revenueByDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    revenueByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const order of ordersInWindow) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (revenueByDay.has(key)) revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(order.total));
  }

  const revenue = Number(revenueAgg._sum.total ?? 0);
  const lowStockCount = Number(lowStockRows[0]?.count ?? 0);

  return {
    revenue,
    orderCount,
    customerCount,
    productCount,
    lowStockCount,
    abandonedCartCount: abandonedCarts.length,
    pendingReturnsCount,
    avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
    revenueTrend: Array.from(revenueByDay.entries()).map(([date, total]) => ({ date: date.slice(5), total })),
    ordersByStatus: statusGroups.map((g) => ({ status: g.status.replace(/_/g, " "), count: g._count })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.total),
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      customer: o.user?.name ?? o.user?.email ?? o.guestEmail ?? "Guest",
    })),
    lowStockVariants: lowStockVariantRows.map((v) => ({
      id: v.id,
      sku: v.sku,
      stock: v.stock,
      threshold: v.lowStockThreshold,
      productName: v.productName,
      productSlug: v.productSlug,
      label: formatVariantLabel(v),
    })),
  };
}
