import { db } from "@/lib/db";

/**
 * Shared totalOrders/totalSpend/cancelled-orders aggregation — extracted from what used to be
 * inline in src/app/admin/customers/[id]/page.tsx so the Customer Care 360 panel and that page
 * compute the exact same numbers instead of two copies drifting apart.
 */
export async function getCustomerSummary(userId: string) {
  const customer = await db.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          statusHistory: { select: { status: true } },
          items: { select: { productName: true, quantity: true } },
          shipment: { select: { trackingNumber: true, courierName: true, trackingStatus: true } },
        },
      },
      addresses: true,
    },
  });
  if (!customer) return null;

  const spend = customer.orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + Number(o.total), 0);
  const cancelledOrders = customer.orders.filter((o) => o.status === "CANCELLED");
  const returnedOrders = customer.orders.filter((o) => o.status === "RETURNED" || o.status === "RETURN_REQUESTED");
  const currentOrders = customer.orders.filter((o) => !["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].includes(o.status));
  const previousOrders = customer.orders.filter((o) => o.status === "DELIVERED");

  return {
    customer,
    totalOrders: customer.orders.length,
    totalSpend: spend,
    currentOrders,
    previousOrders,
    cancelledOrders,
    returnedOrders,
  };
}
