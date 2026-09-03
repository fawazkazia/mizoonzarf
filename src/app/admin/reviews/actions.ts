"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { recomputeProductRating } from "@/lib/reviews";

export async function setReviewApproval(id: string, isApproved: boolean) {
  const session = await requirePermission("products.edit");
  const review = await db.review.update({ where: { id }, data: { isApproved } });
  await recomputeProductRating(review.productId);
  await logStaffActivity({ actorId: session.user.id, action: "REVIEW_APPROVAL_CHANGED", module: "products", entityType: "Review", entityId: id, after: { isApproved } });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: string) {
  const session = await requirePermission("products.edit");
  const review = await db.review.delete({ where: { id } });
  await recomputeProductRating(review.productId);
  await logStaffActivity({ actorId: session.user.id, action: "REVIEW_DELETED", module: "products", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
}
