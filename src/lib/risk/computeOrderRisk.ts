import { db } from "@/lib/db";
import type { PaymentMethod, Prisma, RiskLevel } from "@/generated/prisma/client";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const RISK_REASON_LABELS: Record<string, string> = {
  REPEATED_CANCELLATIONS: "Repeated order cancellations",
  HIGH_CANCELLATION_RATE: "High cancellation rate on past orders",
  LIKELY_DELIVERY_REFUSALS: "History of cancellations after shipping (likely refused deliveries)",
  REPEATED_COD: "Repeated Cash on Delivery orders",
  MULTI_ACCOUNT_PHONE: "This mobile number is linked to multiple customer accounts",
  MULTI_IDENTITY_ADDRESS: "Multiple customers have shipped to this address recently",
  HIGH_ORDER_FREQUENCY: "Unusually high order frequency in the last 24 hours",
  HIGH_VALUE_COD_NEW_CUSTOMER: "High-value Cash on Delivery order from a customer with little delivery history",
};

interface ComputeOrderRiskInput {
  userId?: string;
  phone: string;
  address: { line1?: string | null; postalCode?: string | null };
  paymentMethod: PaymentMethod;
  orderTotal: number;
  highValueCodThreshold: number;
}

export interface OrderRiskResult {
  riskLevel: RiskLevel;
  riskScore: number;
  riskReasons: string[];
}

/**
 * Computes a fraud-risk snapshot for a checkout in progress. Read-only — run this BEFORE
 * db.$transaction() in the checkout route, since it issues several independent count queries
 * that don't need transactional isolation and would otherwise risk Prisma's interactive
 * transaction timeout. Never auto-rejects; the caller (checkout route) decides what to do
 * with the result, and admins can always override a customer's computed reliability.
 */
export async function computeOrderRisk({
  userId,
  phone,
  address,
  paymentMethod,
  orderTotal,
  highValueCodThreshold,
}: ComputeOrderRiskInput): Promise<OrderRiskResult> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - NINETY_DAYS_MS);
  const oneDayAgo = new Date(now.getTime() - ONE_DAY_MS);

  const identityWhere: Prisma.OrderWhereInput = userId ? { userId } : { guestPhone: phone };

  const [totalOrders, cancelledOrders, deliveredOrders, postShipCancellations, codOrders90d, recentOrders24h, phoneAccounts, user] =
    await Promise.all([
      db.order.count({ where: identityWhere }),
      db.order.count({ where: { ...identityWhere, status: "CANCELLED" } }),
      db.order.count({ where: { ...identityWhere, status: "DELIVERED" } }),
      db.order.count({
        where: { ...identityWhere, status: "CANCELLED", statusHistory: { some: { status: { in: ["SHIPPED", "OUT_FOR_DELIVERY"] } } } },
      }),
      db.order.count({ where: { ...identityWhere, paymentMethod: "COD", createdAt: { gte: ninetyDaysAgo } } }),
      db.order.count({ where: { ...identityWhere, createdAt: { gte: oneDayAgo } } }),
      db.verifiedPhone.findMany({ where: { phone, userId: { not: null } }, select: { userId: true }, distinct: ["userId"] }),
      userId ? db.user.findUnique({ where: { id: userId }, select: { reliabilityStatus: true, reliabilityOverride: true } }) : null,
    ]);

  let score = 0;
  const reasons: string[] = [];

  if (cancelledOrders >= 2) {
    score += 15;
    reasons.push("REPEATED_CANCELLATIONS");
  }
  if (totalOrders >= 3 && cancelledOrders / totalOrders > 0.4) {
    score += 30;
    reasons.push("HIGH_CANCELLATION_RATE");
  }
  if (postShipCancellations >= 1) {
    score += Math.min(postShipCancellations * 25, 50);
    reasons.push("LIKELY_DELIVERY_REFUSALS");
  }
  if (codOrders90d >= 3) {
    score += 10;
    reasons.push("REPEATED_COD");
  }
  if (phoneAccounts.length > 1) {
    score += 30;
    reasons.push("MULTI_ACCOUNT_PHONE");
  }
  if (recentOrders24h >= 3) {
    score += 15;
    reasons.push("HIGH_ORDER_FREQUENCY");
  }
  if (paymentMethod === "COD" && orderTotal > highValueCodThreshold && deliveredOrders < 2) {
    score += 20;
    reasons.push("HIGH_VALUE_COD_NEW_CUSTOMER");
  }

  if (address.line1 && address.postalCode) {
    const addressMatches = await db.order.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
        shippingAddress: { path: ["postalCode"], equals: address.postalCode },
      },
      select: { userId: true, guestEmail: true, shippingAddress: true },
      take: 50,
    });
    const line1Normalized = address.line1.trim().toLowerCase();
    const identities = new Set<string>();
    for (const match of addressMatches) {
      const shipping = match.shippingAddress as { line1?: string } | null;
      if (shipping?.line1?.trim().toLowerCase() !== line1Normalized) continue;
      identities.add(match.userId ?? match.guestEmail ?? "unknown");
    }
    if (identities.size > 2) {
      score += 20;
      reasons.push("MULTI_IDENTITY_ADDRESS");
    }
  }

  const effectiveReliability = user?.reliabilityOverride ?? user?.reliabilityStatus;
  let riskLevel: RiskLevel;
  if (effectiveReliability === "TRUSTED") {
    riskLevel = "LOW";
  } else if (effectiveReliability === "HIGH_RISK") {
    riskLevel = "HIGH";
  } else if (score >= 50) {
    riskLevel = "HIGH";
  } else if (score >= 20) {
    riskLevel = "NORMAL";
  } else {
    riskLevel = "LOW";
  }

  return { riskLevel, riskScore: score, riskReasons: reasons };
}
