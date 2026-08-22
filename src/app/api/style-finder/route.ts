import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toProductCard, cardInclude } from "@/lib/data/products";
import type { Prisma, Gender } from "@/generated/prisma/client";

const BUDGET_RANGES: Record<string, { gte?: number; lte?: number }> = {
  under_200: { lte: 200 },
  "200_500": { gte: 200, lte: 500 },
  "500_1000": { gte: 500, lte: 1000 },
  over_1000: { gte: 1000 },
};

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const occasion = params.get("occasion");
  const gender = params.get("gender");
  const style = params.get("style");
  const color = params.get("color");
  const budget = params.get("budget");

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (gender && gender !== "any") where.gender = gender.toUpperCase() as Gender;

  const tags: string[] = [];
  if (occasion) tags.push(occasion);
  if (style) tags.push(style);
  if (tags.length > 0) where.tags = { hasSome: tags };

  if (color) {
    where.variants = { some: { color: { equals: color, mode: "insensitive" } } };
  }

  if (budget && BUDGET_RANGES[budget]) {
    where.basePrice = BUDGET_RANGES[budget];
  }

  const products = await db.product.findMany({ where, take: 8, include: cardInclude });
  return NextResponse.json({ products: products.map(toProductCard) });
}
