import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    const popular = await db.searchLog.findMany({ orderBy: { count: "desc" }, take: 6 });
    return NextResponse.json({ products: [], popular: popular.map((p) => p.term) });
  }

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
        { brand: { name: { contains: q, mode: "insensitive" } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      compareAtPrice: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 8,
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.basePrice),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      image: p.images[0]?.url ?? null,
    })),
    popular: [],
  });
}

export async function POST(req: NextRequest) {
  const { term } = await req.json();
  const cleaned = String(term ?? "").trim().toLowerCase();
  if (!cleaned) return NextResponse.json({ ok: true });

  await db.searchLog.upsert({
    where: { term: cleaned },
    update: { count: { increment: 1 } },
    create: { term: cleaned },
  });

  return NextResponse.json({ ok: true });
}
