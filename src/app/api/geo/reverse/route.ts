import { NextRequest, NextResponse } from "next/server";
import { getGeoProvider } from "@/lib/geo/registry";

export async function POST(req: NextRequest) {
  const provider = getGeoProvider();
  if (!provider.isConfigured()) return NextResponse.json({ error: "Location lookup isn't configured." }, { status: 400 });

  const body = await req.json();
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Missing lat/lng." }, { status: 400 });
  }

  try {
    const address = await provider.reverseGeocode(lat, lng);
    return NextResponse.json({ address });
  } catch (err) {
    console.error("[geo/reverse] failed", err);
    return NextResponse.json({ error: "We couldn't determine your address from your location." }, { status: 502 });
  }
}
