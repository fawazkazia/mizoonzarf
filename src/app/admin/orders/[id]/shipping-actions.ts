"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin-auth";
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
  await requireStaff();
  await createShipmentStep(orderId);
  revalidateOrderPaths(orderId);
}

export async function assignAwbAction(orderId: string) {
  await requireStaff();
  await assignAwbStep(orderId);
  revalidateOrderPaths(orderId);
}

export async function generateLabelAction(orderId: string) {
  await requireStaff();
  await generateLabelStep(orderId);
  revalidateOrderPaths(orderId);
}

export async function schedulePickupAction(orderId: string) {
  await requireStaff();
  await schedulePickupStep(orderId);
  revalidateOrderPaths(orderId);
}

export async function trackShipmentAction(orderId: string) {
  await requireStaff();
  await trackShipmentStep(orderId, "MANUAL");
  revalidateOrderPaths(orderId);
}

export async function cancelShipmentAction(orderId: string) {
  await requireStaff();
  await cancelShipmentStep(orderId);
  revalidateOrderPaths(orderId);
}

export async function retryShipmentAction(orderId: string) {
  await requireStaff();
  await retryShipment(orderId);
  revalidateOrderPaths(orderId);
}
