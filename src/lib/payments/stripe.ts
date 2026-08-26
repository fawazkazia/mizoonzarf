import Stripe from "stripe";
import type { ChargeRequest, ChargeResult, PaymentMethodId, PaymentProvider, RefundResult } from "./provider";

let _client: Stripe | null = null;
function client(): Stripe {
  if (!_client) _client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _client;
}

function toPlainJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

export class StripePaymentProvider implements PaymentProvider {
  id: PaymentMethodId = "CARD";
  label = "Credit/Debit Card";

  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const session = await client().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: request.currency.toLowerCase(),
            unit_amount: Math.round(request.amount * 100),
            product_data: { name: `Order ${request.orderNumber}` },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: request.orderId, orderNumber: request.orderNumber },
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
    });

    return {
      status: "PENDING",
      transactionRef: session.id,
      redirectUrl: session.url ?? undefined,
      raw: toPlainJson(session),
    };
  }

  async refund(transactionRef: string): Promise<RefundResult> {
    const session = await client().checkout.sessions.retrieve(transactionRef);
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) {
      throw new Error(`Checkout session ${transactionRef} has no payment to refund.`);
    }
    const refund = await client().refunds.create({ payment_intent: paymentIntentId });
    return { status: "REFUNDED", raw: toPlainJson(refund) };
  }
}
