import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders/payment-events";

export const runtime = "nodejs";

/**
 * Optimistic client-side confirmation path: Razorpay's Checkout.js modal
 * resolves in the browser before any webhook arrives, so this verifies the
 * signature and marks the order paid immediately. The webhook
 * (/api/webhooks/razorpay) remains the source of truth and safely no-ops on
 * redelivery since markOrderPaid is idempotent.
 */
export async function POST(req: NextRequest) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ ok: false, error: "Razorpay is not configured." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ ok: false, error: "Missing verification fields." }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(String(razorpay_signature));
  const valid = expectedBuf.length === givenBuf.length && crypto.timingSafeEqual(expectedBuf, givenBuf);

  if (!valid) {
    // Leave the order PENDING rather than failing it — a bad client-side
    // signature doesn't prove the payment failed; the webhook is the final word.
    return NextResponse.json({ ok: false, error: "Signature verification failed." }, { status: 400 });
  }

  await markOrderPaid(orderId, razorpay_payment_id, { razorpay_order_id, razorpay_payment_id, razorpay_signature });
  return NextResponse.json({ ok: true });
}
