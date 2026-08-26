import Razorpay from "razorpay";
import { getSettings } from "@/lib/settings";
import type { ChargeRequest, ChargeResult, PaymentMethodId, PaymentProvider, RefundResult } from "./provider";

let _client: Razorpay | null = null;
function client(): Razorpay {
  if (!_client) {
    _client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
  }
  return _client;
}

function toPlainJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Razorpay's checkout is modal-based (Checkout.js), not redirect-based like
 * Stripe Checkout — charge() creates a Razorpay order and hands back a
 * `clientAction` payload instead of a redirectUrl; the browser opens the
 * modal itself and posts the result to /api/checkout/razorpay/verify.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  id: PaymentMethodId = "RAZORPAY";
  label = "UPI / Cards / Netbanking / Wallets";

  isConfigured(): boolean {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const settings = await getSettings();
    const rzpOrder = await client().orders.create({
      amount: Math.round(request.amount * 100),
      currency: request.currency,
      receipt: request.orderNumber,
      notes: { orderId: request.orderId, orderNumber: request.orderNumber },
    });

    return {
      status: "PENDING",
      transactionRef: rzpOrder.id,
      clientAction: {
        type: "razorpay_checkout",
        keyId: process.env.RAZORPAY_KEY_ID!,
        razorpayOrderId: rzpOrder.id,
        amount: Number(rzpOrder.amount),
        currency: String(rzpOrder.currency),
        name: settings.brandName,
        orderNumber: request.orderNumber,
      },
      raw: toPlainJson(rzpOrder),
    };
  }

  /** transactionRef must be the captured razorpay_payment_id by the time this runs, not the order id. */
  async refund(transactionRef: string): Promise<RefundResult> {
    const refund = await client().payments.refund(transactionRef, {});
    return { status: "REFUNDED", raw: toPlainJson(refund) };
  }
}
