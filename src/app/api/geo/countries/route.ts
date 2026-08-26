import { NextResponse } from "next/server";
import { getAllCountries } from "@/lib/geo/countries";

export async function GET() {
  return NextResponse.json({ countries: getAllCountries() });
}
