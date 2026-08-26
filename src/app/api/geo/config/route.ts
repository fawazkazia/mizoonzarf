import { NextResponse } from "next/server";
import { getGeoProvider } from "@/lib/geo/registry";

export async function GET() {
  return NextResponse.json({ configured: getGeoProvider().isConfigured() });
}
