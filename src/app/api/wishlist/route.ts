import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ productIds: [] });

  const items = await db.wishlistItem.findMany({ where: { userId: session.user.id }, select: { productId: true } });
  return NextResponse.json({ productIds: items.map((i) => i.productId) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in to use your wishlist." }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Missing productId." }, { status: 400 });

  await db.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    update: {},
    create: { userId: session.user.id, productId },
  });

  return NextResponse.json({ ok: true, inWishlist: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in to use your wishlist." }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Missing productId." }, { status: 400 });

  await db.wishlistItem.deleteMany({ where: { userId: session.user.id, productId } });
  return NextResponse.json({ ok: true, inWishlist: false });
}
