"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import {
  assignAwbStep,
  cancelShipmentStep,
  createShipmentStep,
  generateLabelStep,
  retryShipment,
  schedulePickupStep,
  trackShipmentStep,
} from "@/lib/shipping/orchestrator";

function revalidateOrderPaths(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/shipping");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function createShipmentAction(orderId: string) {
  const session = await requirePermission("orders.edit");
  await createShipmentStep(orderId);
  await logStaffActivity({ actorId: session.user.id, action: "SHIPMENT_CREATED", module: "orders", entityType: "Order", entityId: orderId });
  revalidateOrderPaths(orderId);
}

export async function assignAwbAction(orderId: string) {
  const session = await requirePermission("orders.edit");
  await assignAwbStep(orderId);
  await logStaffActivity({ actorId: session.user.id, action: "SHIPMENT_AWB_ASSIGNED", module: "orders", entityType: "Order", entityId: orderId });
  revalidateOrderPaths(orderId);
}

export async function generateLabelAction(orderId: string) {
  const session = await requirePermission("orders.edit");
  await generateLabelStep(orderId);
  await logStaffActivity({ actorId: session.user.id, action: "SHIPMENT_LABEL_GENERATED", module: "orders", entityType: "Order", entityId: orderId });
  revalidateOrderPaths(orderId);
}

export async function schedulePickupAction(orderId: string) {
  const session = await requirePermission("orders.edit");
  await schedulePickupStep(orderId);
  await logStaffActivity({ actorId: session.user.id, action: "SHIPMENT_PICKUP_SCHEDULED", module: "orders", entityType: "Order", entityId: orderId });
  revalidateOrderPaths(orderId);
}

export async function trackShipmentAction(orderId: string) {
  await requirePermission("orders.viewShipping");
  await trackShipmentStep(orderId, "MANUAL");
  revalidateOrderPaths(orderId);
}

export async function cancelShipmentAction(orderId: string) {
  const session = await requirePermission("orders.edit");
  await cancelShipmentStep(orderId);
  await logStaffActivity({ actorId: session.user.id, action: "SHIPMENT_CANCELLED", module: "orders", entityType: "Order", entityId: orderId });
  revalidateOrderPaths(orderId);
}

export async function retryShipmentAction(orderId: string) {
  const session = await requirePermission("orders.edit");
  await retryShipment(orderId);
  await logStaffActivity({ actorId: session.user.id, action: "SHIPMENT_RETRIED", module: "orders", entityType: "Order", entityId: orderId });
  revalidateOrderPaths(orderId);
}
