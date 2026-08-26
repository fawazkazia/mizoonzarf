"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { createNotification } from "@/lib/notifications/inapp";
import { getPaymentProvider } from "@/lib/payments/registry";
import { markOrderFailed, markOrderPaid } from "@/lib/orders/payment-events";
import { applyOrderStatus } from "@/lib/orders/status";
import { reverseLoyaltyPoints } from "@/lib/loyalty";
import type { OrderStatus } from "@/generated/prisma/client";

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  await requireStaff();
  await applyOrderStatus(orderId, status, note);
}

export async function updateShipment(orderId: string, data: { carrier?: string; trackingNumber?: string; estimatedDelivery?: string }) {
  await requireStaff();

  await db.shipment.upsert({
    where: { orderId },
    update: {
      carrier: data.carrier || null,
      trackingNumber: data.trackingNumber || null,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
    },
    create: {
      orderId,
      carrier: data.carrier || null,
      trackingNumber: data.trackingNumber || null,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
    },
  });

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
  await requireStaff();

  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) throw new Error("Order not found.");

  const provider = getPaymentProvider(order.paymentMethod);
  const payment = order.payments.find((p) => p.status === "PAID");
  if (!provider.refund || !payment?.transactionRef) {
    throw new Error(`${provider.label} doesn't support refunds through this dashboard yet.`);
  }

  const result = await provider.refund(payment.transactionRef);

  await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: result.status, rawResponse: result.raw as never } });
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: result.status, status: "REFUNDED" } });
    await tx.orderStatusHistory.create({ data: { orderId, status: "REFUNDED", note: `Refunded via ${provider.label}.` } });
    await reverseLoyaltyPoints(tx, orderId, order.orderNumber);
  });

  if (order.userId) {
    await createNotification({
      userId: order.userId,
      type: "ORDER_STATUS",
      title: `Order ${order.orderNumber}`,
      body: "Your payment has been refunded.",
      link: `/account/orders/${orderId}`,
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}
