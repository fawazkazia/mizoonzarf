import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments/registry";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Re-runs the charge for an order that already exists but never got paid —
 * the shopper closed the payment popup, or a card attempt failed and they
 * want to try again. Never creates a new order: the same order/orderNumber
 * is reused so markOrderPaid's idempotent PENDING -> PAID transition still
 * applies once this new attempt succeeds.
 */
export async function POST(req: NextRequest, { params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const order = await db.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.userId && order.userId !== session?.user?.id) {
    return NextResponse.json({ error: "You don't have access to this order." }, { status: 403 });
  }
  if (order.paymentMethod === "COD") {
    return NextResponse.json({ error: "This order doesn't need online payment." }, { status: 400 });
  }
  if (order.paymentStatus !== "PENDING") {
    return NextResponse.json({ error: "This order's payment can't be retried anymore." }, { status: 400 });
  }

  const provider = getPaymentProvider(order.paymentMethod);
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: `${provider.label} isn't available right now.` }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let charge;
  try {
    charge = await provider.charge({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency,
      successUrl: `${siteUrl}/checkout/confirmation/${order.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${siteUrl}/checkout/confirmation/${order.orderNumber}`,
    });
  } catch (err) {
    console.error("[orders/retry-payment] provider.charge failed", err);
    return NextResponse.json({ error: "We couldn't start your payment. Please try again." }, { status: 502 });
  }

  try {
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: order.paymentMethod,
        status: charge.status,
        amount: Number(order.total),
        currency: order.currency,
        transactionRef: charge.transactionRef,
        rawResponse: charge.raw as never,
      },
    });
  } catch (err) {
    console.error("[orders/retry-payment] failed to record payment row", err);
  }

  return NextResponse.json({ ok: true, redirectUrl: charge.redirectUrl, clientAction: charge.clientAction });
}
