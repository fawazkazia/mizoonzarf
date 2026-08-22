"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { recomputeProductRating } from "@/lib/reviews";

export async function setReviewApproval(id: string, isApproved: boolean) {
  await requireStaff();
  const review = await db.review.update({ where: { id }, data: { isApproved } });
  await recomputeProductRating(review.productId);
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: string) {
  await requireStaff();
  const review = await db.review.delete({ where: { id } });
  await recomputeProductRating(review.productId);
  revalidatePath("/admin/reviews");
}
