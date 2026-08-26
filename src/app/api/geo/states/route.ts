import { NextRequest, NextResponse } from "next/server";
import { getStatesForCountry } from "@/lib/geo/countries";

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  if (!country) return NextResponse.json({ error: "Missing country." }, { status: 400 });

  return NextResponse.json({ states: getStatesForCountry(country) });
}
