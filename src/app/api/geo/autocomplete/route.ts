import { NextRequest, NextResponse } from "next/server";
import { getGeoProvider } from "@/lib/geo/registry";

export async function GET(req: NextRequest) {
  const provider = getGeoProvider();
  if (!provider.isConfigured()) return NextResponse.json({ suggestions: [] });

  const query = req.nextUrl.searchParams.get("q");
  const sessionToken = req.nextUrl.searchParams.get("sessionToken");
  const countryCode = req.nextUrl.searchParams.get("country") ?? undefined;
  if (!query || !sessionToken) return NextResponse.json({ error: "Missing q or sessionToken." }, { status: 400 });

  try {
    const suggestions = await provider.autocomplete(query, sessionToken, { countryCode });
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[geo/autocomplete] failed", err);
    return NextResponse.json({ error: "Address search is temporarily unavailable." }, { status: 502 });
  }
}
