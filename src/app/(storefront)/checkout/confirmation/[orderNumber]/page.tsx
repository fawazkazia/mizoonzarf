import { notFound } from "next/navigation";
import Stripe from "stripe";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/currency";
import { markOrderPaid } from "@/lib/orders/payment-events";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { CompletePaymentButton } from "@/components/orders/CompletePaymentButton";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function ConfirmationPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const { session_id: sessionId } = await searchParams;
  const [session, settings] = await Promise.all([auth(), getSettings()]);
  const brand = settings.promoStrips.brandsBanner;
  const gradient = `linear-gradient(90deg, ${brand.gradientFrom}, ${brand.gradientVia}, ${brand.gradientTo})`;
  const accent = brand.gradientVia;
  const orderInclude = {
    items: true,
    statusHistory: { orderBy: { createdAt: "asc" as const } },
    shipment: { include: { events: { orderBy: { occurredAt: "desc" as const } } } },
  };
  const initialOrder = await db.order.findUnique({ where: { orderNumber }, include: orderInclude });

  if (!initialOrder) notFound();
  let order = initialOrder;

  // Webhook delivery can lag the browser's redirect back from Stripe — reconcile as a fast-path fallback.
  if (sessionId && order.paymentStatus === "PENDING" && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      // session_id is a public query param — require it to actually belong to THIS order (metadata is server-set, unforgeable) before trusting it.
      if (checkoutSession.metadata?.orderId === order.id && checkoutSession.payment_status === "paid") {
        await markOrderPaid(order.id, checkoutSession.id, checkoutSession);
        const refreshed = await db.order.findUnique({ where: { orderNumber }, include: orderInclude });
        if (!refreshed) notFound();
        order = refreshed;
      }
    } catch (err) {
      console.error("[checkout/confirmation] Stripe session reconciliation failed", err);
    }
  }

  // COD is never "paid" ahead of delivery by design, so a PENDING COD order is the
  // normal happy path — only a prepaid method sitting at PENDING actually needs action.
  const paymentPending = order.paymentStatus === "PENDING" && order.paymentMethod !== "COD";
  const paymentFailed = order.paymentStatus === "FAILED";

  return (
    <Container className="py-20 text-center">
      <div className="mx-auto max-w-3xl">
        {paymentFailed ? (
          <>
            <XCircle size={48} className="mx-auto text-sale" strokeWidth={1.2} />
            <h1 className="mt-6 font-display text-4xl">Payment Failed</h1>
            <p className="mt-3 text-ink-soft">
              Your payment for order <strong>{order.orderNumber}</strong> didn&apos;t go through, so it&apos;s been cancelled.
            </p>
          </>
        ) : paymentPending ? (
          <>
            <Clock3 size={48} className="mx-auto text-gold-deep" strokeWidth={1.2} />
            <h1 className="mt-6 font-display text-4xl">Complete Your Payment</h1>
            <p className="mt-3 text-ink-soft">
              Order <strong>{order.orderNumber}</strong> has been placed — complete your payment to confirm it.
            </p>
            <div className="mt-5 flex justify-center">
              <CompletePaymentButton orderId={order.id} orderNumber={order.orderNumber} gradient={gradient} />
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 size={48} className="mx-auto text-success" strokeWidth={1.2} />
            <h1 className="mt-6 font-display text-4xl">Thank You!</h1>
            <p className="mt-3 text-ink-soft">
              Your order <strong>{order.orderNumber}</strong> has been placed. We&apos;ve sent a confirmation to your email.
            </p>
          </>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-5xl text-left">
        <OrderTimeline
          status={order.status}
          paymentStatus={order.paymentStatus}
          statusHistory={order.statusHistory}
          placedAt={order.createdAt}
          paymentMethod={order.paymentMethod}
          gradient={gradient}
          accent={accent}
          shipment={
            order.shipment && {
              provider: order.shipment.provider,
              carrier: order.shipment.carrier,
              courierName: order.shipment.courierName,
              trackingNumber: order.shipment.trackingNumber,
              awbCode: order.shipment.awbCode,
              estimatedDelivery: order.shipment.estimatedDelivery,
              shippedAt: order.shipment.shippedAt,
              deliveredAt: order.shipment.deliveredAt,
              trackingStatus: order.shipment.trackingStatus,
              deliveryException: order.shipment.deliveryException,
              events: order.shipment.events.map((e) => ({
                status: e.status,
                occurredAt: e.occurredAt.toISOString(),
                location: e.location,
                activity: e.activity,
              })),
            }
          }
        />
      </div>

      <div className="mx-auto mt-10 max-w-3xl border border-line p-6 text-left">
        <h2 className="mb-4 font-display text-xl">Order Details</h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
              </span>
              <span>{formatINR(Number(item.subtotal))}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-medium">
          <span>Total</span>
          <span>{formatINR(Number(order.total))}</span>
        </div>
        <p className="mt-2 text-xs text-ink-soft">Payment method: {order.paymentMethod.replace("_", " ")}</p>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={session?.user && order.userId === session.user.id ? `/account/orders/${order.id}` : `/track-order?order=${order.orderNumber}`}>
          Track Your Order
        </ButtonLink>
        <ButtonLink href="/men" variant="secondary">
          Continue Shopping
        </ButtonLink>
      </div>
    </Container>
  );
}
