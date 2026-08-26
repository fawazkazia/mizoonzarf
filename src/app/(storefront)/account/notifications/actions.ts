"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) return;

  await db.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true },
  });
  revalidatePath("/account/notifications");
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user) return;

  await db.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/account/notifications");
}
