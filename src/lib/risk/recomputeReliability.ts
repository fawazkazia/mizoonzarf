import type { Prisma } from "@/generated/prisma/client";

const TRUSTED_MIN_DELIVERED = 5;
const HIGH_RISK_MIN_POST_SHIP_CANCELLATIONS = 2;
const HIGH_RISK_MIN_ORDERS_FOR_RATE = 3;
const HIGH_RISK_CANCELLATION_RATE = 0.4;

/**
 * Recalculates a customer's reliability status from their order history. Called from
 * applyOrderStatus() (src/lib/orders/status.ts) whenever an order transitions to CANCELLED
 * or DELIVERED, inside the same transaction. Never overwrites an admin's manual override —
 * see the User.reliabilityOverride field.
 */
export async function recomputeUserReliability(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { reliabilityOverride: true } });
  if (!user || user.reliabilityOverride) return;

  const [totalOrders, cancelledOrders, deliveredOrders, postShipCancellations] = await Promise.all([
    tx.order.count({ where: { userId } }),
    tx.order.count({ where: { userId, status: "CANCELLED" } }),
    tx.order.count({ where: { userId, status: "DELIVERED" } }),
    tx.order.count({
      where: { userId, status: "CANCELLED", statusHistory: { some: { status: { in: ["SHIPPED", "OUT_FOR_DELIVERY"] } } } },
    }),
  ]);

  const highCancellationRate = totalOrders >= HIGH_RISK_MIN_ORDERS_FOR_RATE && cancelledOrders / totalOrders > HIGH_RISK_CANCELLATION_RATE;

  let reliabilityStatus: "TRUSTED" | "NORMAL" | "HIGH_RISK";
  if (postShipCancellations >= HIGH_RISK_MIN_POST_SHIP_CANCELLATIONS || highCancellationRate) {
    reliabilityStatus = "HIGH_RISK";
  } else if (deliveredOrders >= TRUSTED_MIN_DELIVERED && postShipCancellations === 0) {
    reliabilityStatus = "TRUSTED";
  } else {
    reliabilityStatus = "NORMAL";
  }

  await tx.user.update({ where: { id: userId }, data: { reliabilityStatus, reliabilityUpdatedAt: new Date() } });
}
