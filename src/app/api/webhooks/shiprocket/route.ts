import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingestTrackingEvents } from "@/lib/shipping/orchestrator";

export const runtime = "nodejs";

interface ShiprocketWebhookPayload {
  awb?: string;
  awb_code?: string;
  current_status?: string;
  order_id?: string | number;
  shipment_id?: string | number;
  channel_order_id?: string;
  location?: string;
  activity?: string;
  current_timestamp?: string;
}

/** Shiprocket sends the token you configured in its webhook settings as a header, not an HMAC signature — nothing to compute, only to compare. */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (!secret) return false;

  const provided = req.headers.get("x-api-key") ?? "";
  const secretBuf = Buffer.from(secret);
  const providedBuf = Buffer.from(provided);
  return secretBuf.length === providedBuf.length && crypto.timingSafeEqual(secretBuf, providedBuf);
}

export async function POST(req: NextRequest) {
  if (!process.env.SHIPROCKET_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Shiprocket webhook is not configured." }, { status: 400 });
  }
  if (!isAuthorized(req)) {
    console.error("[webhooks/shiprocket] unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as ShiprocketWebhookPayload;
  const awb = payload.awb || payload.awb_code;
  const status = payload.current_status;

  if (!status || (!awb && !payload.shipment_id && !payload.order_id)) {
    return NextResponse.json({ error: "Missing status or shipment identifier." }, { status: 400 });
  }

  const shipment = await db.shipment.findFirst({
    where: {
      OR: [
        awb ? { awbCode: awb } : undefined,
        payload.shipment_id ? { shiprocketShipmentId: String(payload.shipment_id) } : undefined,
        payload.order_id ? { shiprocketOrderId: String(payload.order_id) } : undefined,
      ].filter(Boolean) as object[],
    },
  });

  if (!shipment) {
    console.error("[webhooks/shiprocket] no matching shipment", { awb, shipmentId: payload.shipment_id, orderId: payload.order_id });
    return NextResponse.json({ received: true, matched: false });
  }

  await ingestTrackingEvents(
    shipment.id,
    [
      {
        status,
        location: payload.location,
        activity: payload.activity,
        occurredAt: payload.current_timestamp ? new Date(payload.current_timestamp) : new Date(),
      },
    ],
    "WEBHOOK",
    payload
  );

  return NextResponse.json({ received: true });
}
