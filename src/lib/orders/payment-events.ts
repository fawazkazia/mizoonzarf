import { db } from "@/lib/db";
import { notify, ORDER_EVENT_TEMPLATES } from "@/lib/notifications/registry";
import { sendOrderEmail } from "@/lib/notifications/order-email";
import { generateInvoiceNumber } from "@/lib/orders/invoicing";
import { maybeAutoCreateShipment } from "@/lib/shipping/orchestrator";

async function resolveContacts(orderId: string): Promise<{ email: string | null; phone: string | null }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, phone: true } } },
  });
  if (!order) return { email: null, phone: null };
  return {
    email: order.guestEmail ?? order.user?.email ?? null,
    phone: order.guestPhone ?? order.user?.phone ?? null,
  };
}

async function notifySafely(params: { channel: "EMAIL" | "SMS" | "WHATSAPP"; to: string | null; templateKey: string; variables: Record<string, string | number> }) {
  if (!params.to) return;
  try {
    await notify({ channel: params.channel, to: params.to, templateKey: params.templateKey, variables: params.variables });
  } catch (err) {
    console.error(`[payment-events] notify(${params.channel}) failed`, err);
  }
}

/**
 * Idempotent — safe to call more than once for the same order (Stripe *will*
 * redeliver webhooks). The guard is the `updateMany` WHERE clause itself, not
 * a preceding read: a plain SELECT doesn't lock the row under Postgres READ
 * COMMITTED, so a check-then-act guard would race two concurrent deliveries.
 */
export async function markOrderPaid(orderId: string, transactionRef: string, raw?: unknown): Promise<void> {
  const processed = await db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING" },
      data: { paymentStatus: "PAID", status: "PAYMENT_CONFIRMED" },
    });
    if (result.count === 0) return false;

    // Only reached once, on the transition that actually happened — safe to
    // consume a sequence number here without risking a gap from redelivery.
    const invoice = await generateInvoiceNumber(tx);
    await tx.order.update({ where: { id: orderId }, data: { invoiceNumber: invoice.number, invoiceDate: invoice.date } });

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });

    // Match on orderId + PENDING status, not orderId + transactionRef: Razorpay's
    // transactionRef changes between charge-time (order id) and capture-time
    // (payment id), so matching the original ref here would miss the row.
    const paymentUpdate = await tx.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "PAID", transactionRef, rawResponse: raw as never },
    });
    if (paymentUpdate.count === 0) {
      // The checkout route's db.payment.create may have failed earlier — don't leave a PAID order with no Payment row.
      await tx.payment.create({
        data: { orderId, provider: order.paymentMethod, status: "PAID", amount: order.total, currency: order.currency, transactionRef, rawResponse: raw as never },
      });
    }

    await tx.orderStatusHistory.create({
      data: { orderId, status: "PAYMENT_CONFIRMED", note: `Payment confirmed via ${order.paymentMethod.replace(/_/g, " ")}.` },
    });
    return true;
  });

  if (!processed) return;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const { email, phone } = await resolveContacts(orderId);
  const variables = { order_number: order.orderNumber, order_total: Number(order.total) };

  await sendOrderEmail({ orderId, userId: order.userId, to: email, templateKey: ORDER_EVENT_TEMPLATES.PAYMENT_CONFIRMED, variables });
  await notifySafely({ channel: "WHATSAPP", to: phone, templateKey: ORDER_EVENT_TEMPLATES.PAYMENT_CONFIRMED, variables });

  await maybeAutoCreateShipment(orderId);
}

/** Idempotent — same guard pattern as markOrderPaid. Restocks the items reserved at checkout. */
export async function markOrderFailed(orderId: string, reason: string): Promise<void> {
  const processed = await db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED", status: "CANCELLED" },
    });
    if (result.count === 0) return false;

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

    await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note: reason } });

    for (const item of order.items) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      await tx.product.update({ where: { id: item.productId }, data: { purchaseCount: { decrement: item.quantity } } });
    }

    return true;
  });

  if (!processed) return;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const { email } = await resolveContacts(orderId);
  const variables = { order_number: order.orderNumber, order_total: Number(order.total) };

  // Distinct from an admin-initiated CANCELLED (order_cancelled, sent via applyOrderStatus) —
  // this is specifically a failed payment attempt, so customers get an accurate explanation.
  await sendOrderEmail({ orderId, userId: order.userId, to: email, templateKey: "payment_failed", variables });
}
