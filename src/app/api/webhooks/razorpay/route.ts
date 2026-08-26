import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { markOrderFailed, markOrderPaid } from "@/lib/orders/payment-events";

export const runtime = "nodejs";

interface RazorpayPaymentEntity {
  id: string;
  notes?: { orderId?: string; orderNumber?: string };
}

export async function POST(req: NextRequest) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 400 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  const body = await req.text();

  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(signature ?? "");
  const valid = signature && expectedBuf.length === givenBuf.length && crypto.timingSafeEqual(expectedBuf, givenBuf);

  if (!valid) {
    console.error("[webhooks/razorpay] signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "payment.captured": {
      const payment = event.payload?.payment?.entity as RazorpayPaymentEntity | undefined;
      const orderId = payment?.notes?.orderId;
      if (orderId && payment) await markOrderPaid(orderId, payment.id, payment);
      break;
    }
    case "payment.failed": {
      const payment = event.payload?.payment?.entity as RazorpayPaymentEntity | undefined;
      const orderId = payment?.notes?.orderId;
      if (orderId) await markOrderFailed(orderId, "Payment failed at Razorpay.");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
