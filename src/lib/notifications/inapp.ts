import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

/** Never let an in-app notification failure break the caller's primary action. */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await db.notification.create({
      data: { userId: params.userId, type: params.type, title: params.title, body: params.body, link: params.link ?? null },
    });
  } catch (err) {
    console.error("[createNotification] failed", err);
  }
}

export async function notifyWishlistersOfProduct(
  productId: string,
  params: Omit<CreateNotificationParams, "userId">
): Promise<void> {
  const wishlisters = await db.wishlistItem.findMany({ where: { productId }, select: { userId: true } });
  await Promise.all(wishlisters.map((w) => createNotification({ userId: w.userId, ...params })));
}

export async function notifyAllCustomers(params: Omit<CreateNotificationParams, "userId">): Promise<void> {
  const customers = await db.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true } });
  if (customers.length === 0) return;
  await db.notification.createMany({
    data: customers.map((c) => ({ userId: c.id, type: params.type, title: params.title, body: params.body, link: params.link ?? null })),
  });
}
