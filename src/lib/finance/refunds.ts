import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getPaymentProvider } from "@/lib/payments/registry";
import { createNotification } from "@/lib/notifications/inapp";
import { reverseLoyaltyPoints } from "@/lib/loyalty";
import { postOrderRefundEntry } from "@/lib/finance/ledger";

/**
 * The single place both refund paths in this app route through — previously
 * `orders/actions.ts::refundPayment` (a real reversal: gateway call, Payment/Order state,
 * loyalty reversal) and `returns/actions.ts::updateReturnStatus` (which only flipped
 * `Return.status`/`Order.status`, never touching `Payment`/`Order.paymentStatus`) were two
 * disconnected implementations. This unifies them so a return marked REFUNDED always produces
 * the same real financial reversal as an order-level refund.
 *
 * `cogsReversalAmount` is an optional extensibility point for when a caller knows the refunded
 * item was actually restocked (Dr Inventory / Cr COGS) — no current call site passes it, since
 * neither existing refund flow combines "restock" and "refund" into one resolution today.
 */
export async function processRefund(params: {
  orderId: string;
  returnId?: string;
  amount: number;
  reason: string;
  cogsReversalAmount?: number;
  requestedById: string;
}) {
  const order = await db.order.findUniqueOrThrow({ where: { id: params.orderId }, include: { payments: true } });

  const provider = getPaymentProvider(order.paymentMethod);
  const payment = order.payments.find((p) => p.status === "PAID");
  if (!provider.refund || !payment?.transactionRef) {
    throw new Error(`${provider.label} doesn't support refunds through this dashboard yet.`);
  }

  const result = await provider.refund(payment.transactionRef);

  const refund = await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: result.status, rawResponse: result.raw as never } });
    await tx.order.update({ where: { id: params.orderId }, data: { paymentStatus: result.status, status: "REFUNDED" } });
    await tx.orderStatusHistory.create({ data: { orderId: params.orderId, status: "REFUNDED", note: params.reason } });
    await reverseLoyaltyPoints(tx, params.orderId, order.orderNumber);
    if (params.returnId) {
      await tx.return.update({ where: { id: params.returnId }, data: { status: "REFUNDED", refundAmount: params.amount } });
    }
    return tx.refund.create({
      data: {
        orderId: params.orderId,
        returnId: params.returnId,
        paymentId: payment.id,
        amount: params.amount,
        reason: params.reason,
        status: "PROCESSED",
        providerRef: payment.transactionRef,
        rawResponse: result.raw as never,
        createdById: params.requestedById,
      },
    });
  });

  if (order.userId) {
    await createNotification({
      userId: order.userId,
      type: "ORDER_STATUS",
      title: `Order ${order.orderNumber}`,
      body: "Your payment has been refunded.",
      link: `/account/orders/${params.orderId}`,
    });
  }

  // Non-blocking follow-up, matching markOrderPaid's pattern: a misconfigured chart of accounts
  // must never undo a real refund that's already been issued to the customer.
  try {
    const settings = await getSettings();
    await db.$transaction((tx) =>
      postOrderRefundEntry(tx, {
        order,
        refundId: refund.id,
        refundAmount: params.amount,
        taxInclusive: settings.taxInclusive,
        cogsReversalAmount: params.cogsReversalAmount,
        createdById: params.requestedById,
      })
    );
  } catch (err) {
    console.error("[ledger] postOrderRefundEntry failed", err);
    await db.auditLog.create({
      data: { action: "JOURNAL_POST_FAILED", entityType: "Order", entityId: params.orderId, meta: { kind: "ORDER_REFUND", error: String(err) } },
    });
  }

  return refund;
}
