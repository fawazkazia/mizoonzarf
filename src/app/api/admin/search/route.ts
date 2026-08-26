import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [], orders: [], customers: [], variants: [] });

  const [products, orders, customers, variants] = await Promise.all([
    db.product.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] },
      select: { id: true, name: true, slug: true },
      take: 5,
    }),
    db.order.findMany({
      where: { orderNumber: { contains: q, mode: "insensitive" } },
      select: { id: true, orderNumber: true },
      take: 5,
    }),
    db.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, name: true, email: true },
      take: 5,
    }),
    db.productVariant.findMany({
      where: { OR: [{ barcode: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] },
      select: { id: true, sku: true, barcode: true, product: { select: { id: true, name: true } } },
      take: 5,
    }),
  ]);

  return NextResponse.json({ products, orders, customers, variants });
}
