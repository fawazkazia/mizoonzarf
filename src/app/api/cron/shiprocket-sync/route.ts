import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getShippingProviderSettings } from "@/lib/shipping/settings";
import { trackShipmentStep } from "@/lib/shipping/orchestrator";

export const runtime = "nodejs";

const TERMINAL_STATUSES = ["DELIVERED", "RTO DELIVERED", "RTO ACKNOWLEDGED", "CANCELLED", "CANCELED"];
const MAX_PER_RUN = 25;

/**
 * Fallback tracking sync for when webhooks aren't configured or are missed.
 * Intended to be triggered by an external scheduler (Vercel Cron via
 * vercel.json, or any cron-job.org-style service) hitting this URL with
 * `Authorization: Bearer $CRON_SECRET`. The "Track Shipment" admin button
 * calls the same underlying trackShipmentStep for a single shipment on demand.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 400 });

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getShippingProviderSettings();
  if (settings.activeProvider !== "SHIPROCKET") {
    return NextResponse.json({ synced: 0, skipped: "Shiprocket is not the active provider." });
  }

  const staleBefore = new Date(Date.now() - settings.trackingSyncFrequencyMinutes * 60 * 1000);

  const shipments = await db.shipment.findMany({
    where: {
      provider: "SHIPROCKET",
      awbCode: { not: null },
      trackingStatus: { notIn: TERMINAL_STATUSES },
      OR: [{ lastTrackingSyncAt: null }, { lastTrackingSyncAt: { lt: staleBefore } }],
    },
    select: { orderId: true },
    take: MAX_PER_RUN,
  });

  let synced = 0;
  let failed = 0;
  for (const { orderId } of shipments) {
    try {
      await trackShipmentStep(orderId, "POLL");
      synced += 1;
    } catch (err) {
      failed += 1;
      console.error(`[cron/shiprocket-sync] failed for order ${orderId}`, err);
    }
  }

  return NextResponse.json({ synced, failed, checked: shipments.length });
}
