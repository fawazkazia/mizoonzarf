import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validation/review";
import { recomputeProductRating } from "@/lib/reviews";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to write a review." }, { status: 401 });
  }

  const body = reviewSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const isVerifiedPurchase = Boolean(
    await db.orderItem.findFirst({
      where: { productId: body.data.productId, order: { userId: session.user.id, status: { not: "CANCELLED" } } },
    })
  );

  const review = await db.review.create({
    data: {
      productId: body.data.productId,
      userId: session.user.id,
      customerName: session.user.name ?? "Customer",
      rating: body.data.rating,
      title: body.data.title,
      comment: body.data.comment,
      isVerifiedPurchase,
    },
  });

  await recomputeProductRating(body.data.productId);

  return NextResponse.json({ ok: true, review });
}
