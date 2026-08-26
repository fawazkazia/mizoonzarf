import type { Prisma } from "@/generated/prisma/client";

export const POINTS_PER_RUPEE_DIVISOR = 50;

export function estimatePointsEarned(total: number): number {
  return Math.max(0, Math.floor(total / POINTS_PER_RUPEE_DIVISOR));
}

/** Reverses a previously-earned EARN_ORDER transaction for an order, if one
 * exists and hasn't already been reversed. Shared by every code path that can
 * put an order into a points-reversing state (CANCELLED/REFUNDED/RETURNED) —
 * currently `updateOrderStatus` and the direct-refund `refundPayment` action,
 * since the latter writes `Order.status` itself instead of going through the
 * former. */
export async function reverseLoyaltyPoints(tx: Prisma.TransactionClient, orderId: string, orderNumber: string) {
  const earned = await tx.loyaltyTransaction.findFirst({ where: { orderId, type: "EARN_ORDER" } });
  if (!earned) return;

  const alreadyReversed = await tx.loyaltyTransaction.findFirst({ where: { orderId, type: "REVERSE_ORDER" } });
  if (alreadyReversed) return;

  await tx.loyaltyTransaction.create({
    data: {
      loyaltyAccountId: earned.loyaltyAccountId,
      orderId,
      points: -earned.points,
      type: "REVERSE_ORDER",
      description: `Reversal for order ${orderNumber}`,
    },
  });
  await tx.loyaltyAccount.update({ where: { id: earned.loyaltyAccountId }, data: { pointsBalance: { decrement: earned.points } } });
}
