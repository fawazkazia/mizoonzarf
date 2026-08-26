import type { OrderStatus } from "@/generated/prisma/client";

export interface ShipmentStatusClassification {
  /** Coarse business status to write to Order.status/OrderStatusHistory — undefined when the raw status has no matching OrderStatus (granular-only). */
  orderStatus?: OrderStatus;
  /** Plain-language delivery exception text for admin + customer display. */
  deliveryException?: string;
  /** Which step of the tracking timeline this status represents, for ShipmentTimeline. */
  timelineStep?: "CREATED" | "AWB_ASSIGNED" | "PICKUP_SCHEDULED" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED";
}

const NORMALIZED_MAP: Record<string, ShipmentStatusClassification> = {
  "NEW": { timelineStep: "CREATED" },
  "INVOICED": { timelineStep: "CREATED" },
  "READY TO SHIP": { timelineStep: "CREATED" },
  "AWB ASSIGNED": { timelineStep: "AWB_ASSIGNED" },
  "PICKUP QUEUED": { timelineStep: "PICKUP_SCHEDULED" },
  "PICKUP SCHEDULED": { timelineStep: "PICKUP_SCHEDULED" },
  "PICKUP GENERATED": { timelineStep: "PICKUP_SCHEDULED" },
  "PICKED UP": { orderStatus: "SHIPPED", timelineStep: "PICKED_UP" },
  "SHIPPED": { orderStatus: "SHIPPED", timelineStep: "PICKED_UP" },
  "IN TRANSIT": { orderStatus: "SHIPPED", timelineStep: "IN_TRANSIT" },
  "OUT FOR DELIVERY": { orderStatus: "OUT_FOR_DELIVERY", timelineStep: "OUT_FOR_DELIVERY" },
  "DELIVERED": { orderStatus: "DELIVERED", timelineStep: "DELIVERED" },
  "CANCELLED": { orderStatus: "CANCELLED" },
  "CANCELED": { orderStatus: "CANCELLED" },
  "RTO INITIATED": { deliveryException: "This order is being returned to us by the courier." },
  "RTO IN TRANSIT": { deliveryException: "This order is being returned to us by the courier." },
  "RTO DELIVERED": { orderStatus: "RETURNED", deliveryException: "This order was returned to us by the courier." },
  "RTO ACKNOWLEDGED": { orderStatus: "RETURNED", deliveryException: "This order was returned to us by the courier." },
  "LOST": { deliveryException: "The courier has reported this shipment as lost. Our team has been notified." },
  "DAMAGED": { deliveryException: "The courier has reported this shipment as damaged. Our team has been notified." },
  "DISPOSED OFF": { deliveryException: "This shipment could not be delivered and was disposed of by the courier." },
  "UNDELIVERED": { deliveryException: "The courier attempted delivery but it was unsuccessful. We're following up." },
  "PENDING": { deliveryException: "Delivery is delayed. We're checking with the courier." },
  "OUT FOR PICKUP": { timelineStep: "PICKUP_SCHEDULED" },
};

function normalize(rawStatus: string): string {
  return rawStatus.trim().toUpperCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function classifyShiprocketStatus(rawStatus: string): ShipmentStatusClassification {
  return NORMALIZED_MAP[normalize(rawStatus)] ?? {};
}

/** Ordered steps for the granular tracking timeline (ShipmentTimeline component). */
export const TIMELINE_STEPS = ["CREATED", "AWB_ASSIGNED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
