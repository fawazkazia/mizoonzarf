import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { markOrderFailed, markOrderPaid } from "@/lib/orders/payment-events";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhooks/stripe] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const orderId = checkoutSession.metadata?.orderId;
      if (orderId && checkoutSession.payment_status === "paid") {
        await markOrderPaid(orderId, checkoutSession.id, checkoutSession);
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const orderId = checkoutSession.metadata?.orderId;
      if (orderId) {
        await markOrderFailed(orderId, "Payment was not completed.");
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
