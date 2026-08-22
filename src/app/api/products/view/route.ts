import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ ok: false }, { status: 400 });

  await db.product.update({ where: { id: productId }, data: { viewCount: { increment: 1 } } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
