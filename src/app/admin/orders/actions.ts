"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { sendOrderEmail } from "@/lib/notifications/order-email";
import { markOrderFailed, markOrderPaid } from "@/lib/orders/payment-events";
import { applyOrderStatus } from "@/lib/orders/status";
import { processRefund } from "@/lib/finance/refunds";
import type { OrderStatus } from "@/generated/prisma/client";

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  await requireStaff();
  await applyOrderStatus(orderId, status, note);
}

export async function updateShipment(orderId: string, data: { carrier?: string; trackingNumber?: string; estimatedDelivery?: string }) {
  await requireStaff();

  const existing = await db.shipment.findUnique({ where: { orderId } });
  const next = {
    carrier: data.carrier || null,
    trackingNumber: data.trackingNumber || null,
    estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
  };

  await db.shipment.upsert({ where: { orderId }, update: next, create: { orderId, ...next } });

  // Only email when tracking info was actually added or changed — not on every unrelated shipment edit.
  const trackingChanged =
    Boolean(next.trackingNumber) &&
    (next.trackingNumber !== existing?.trackingNumber || next.carrier !== existing?.carrier || next.estimatedDelivery?.getTime() !== existing?.estimatedDelivery?.getTime());

  if (trackingChanged) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (order) {
      const contactEmail = order.guestEmail ?? (order.userId ? (await db.user.findUnique({ where: { id: order.userId }, select: { email: true } }))?.email : null);
      await sendOrderEmail({
        orderId,
        userId: order.userId,
        to: contactEmail,
        templateKey: "tracking_updated",
        variables: { order_number: order.orderNumber },
      });
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function updatePaymentStatus(orderId: string, paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED") {
  await requireStaff();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found.");

  // COD has no real gateway to desync from — a bare flip is correct there.
  // Non-COD orders route PAID/FAILED through the same gateway-aware helpers the
  // Stripe webhook uses, so restock-on-failure and payment-record sync stay consistent.
  if (order.paymentMethod === "COD") {
    await db.order.update({ where: { id: orderId }, data: { paymentStatus } });
  } else if (paymentStatus === "PAID") {
    const payment = await db.payment.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" } });
    await markOrderPaid(orderId, payment?.transactionRef ?? "");
  } else if (paymentStatus === "FAILED") {
    await markOrderFailed(orderId, "Marked failed by staff.");
  } else {
    throw new Error("Use the Refund action for this payment method instead of setting status directly.");
  }

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function refundPayment(orderId: string) {
  const session = await requireStaff();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found.");

  await processRefund({
    orderId,
    amount: Number(order.total),
    reason: "Refunded by admin.",
    requestedById: session.user.id,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}
