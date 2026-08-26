import { NextRequest, NextResponse } from "next/server";
import { getGeoProvider } from "@/lib/geo/registry";

export async function GET(req: NextRequest) {
  const provider = getGeoProvider();
  if (!provider.isConfigured()) return NextResponse.json({ error: "Address search isn't configured." }, { status: 400 });

  const placeId = req.nextUrl.searchParams.get("placeId");
  const sessionToken = req.nextUrl.searchParams.get("sessionToken");
  if (!placeId || !sessionToken) return NextResponse.json({ error: "Missing placeId or sessionToken." }, { status: 400 });

  try {
    const address = await provider.placeDetails(placeId, sessionToken);
    return NextResponse.json({ address });
  } catch (err) {
    console.error("[geo/place] failed", err);
    return NextResponse.json({ error: "We couldn't look up that address." }, { status: 502 });
  }
}
