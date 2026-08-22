import { db } from "@/lib/db";

export async function recomputeProductRating(productId: string) {
  const stats = await db.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });

  await db.product.update({
    where: { id: productId },
    data: { avgRating: stats._avg.rating ?? 0, reviewCount: stats._count },
  });
}
