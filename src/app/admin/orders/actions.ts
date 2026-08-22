"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { notify, ORDER_EVENT_TEMPLATES } from "@/lib/notifications/registry";
import type { OrderStatus } from "@/generated/prisma/client";

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  await requireStaff();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found.");

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status } }),
    db.orderStatusHistory.create({ data: { orderId, status, note: note || undefined } }),
  ]);

  const templateKey = ORDER_EVENT_TEMPLATES[status];
  const contact = order.guestEmail ?? (await db.user.findUnique({ where: { id: order.userId ?? "" } }))?.email;
  if (templateKey && contact) {
    await notify({
      channel: "EMAIL",
      to: contact,
      templateKey,
      variables: { order_number: order.orderNumber, order_total: Number(order.total) },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}

export async function updateShipment(orderId: string, data: { carrier?: string; trackingNumber?: string; estimatedDelivery?: string }) {
  await requireStaff();

  await db.shipment.upsert({
    where: { orderId },
    update: {
      carrier: data.carrier || null,
      trackingNumber: data.trackingNumber || null,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
    },
    create: {
      orderId,
      carrier: data.carrier || null,
      trackingNumber: data.trackingNumber || null,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function updatePaymentStatus(orderId: string, paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED") {
  await requireStaff();
  await db.order.update({ where: { id: orderId }, data: { paymentStatus } });
  revalidatePath(`/admin/orders/${orderId}`);
}
