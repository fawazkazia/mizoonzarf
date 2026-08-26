import { db } from "@/lib/db";
import { getShippingProvider } from "./registry";
import { getShippingProviderSettings } from "./settings";
import { classifyShiprocketStatus } from "./status-map";
import { applyOrderStatus } from "@/lib/orders/status";
import type { CreateShipmentRequest, ShippingAddressInput, TrackingEvent } from "./provider";
import type { Order, OrderItem, Shipment, Warehouse } from "@/generated/prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

/** Forward-progress ordinal for shipment-driven statuses — guards against an out-of-order/redelivered webhook regressing the order. */
const STATUS_RANK: Partial<Record<string, number>> = { SHIPPED: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 3 };

function addressFromJson(value: unknown): ShippingAddressInput {
  const a = value as { line1?: string; line2?: string; city?: string; state?: string; country?: string; postalCode?: string };
  if (!a?.line1 || !a?.city || !a?.postalCode) {
    throw new Error("Order is missing a complete address (street, city, or PIN code) — cannot create a shipment.");
  }
  return { line1: a.line1, line2: a.line2, city: a.city, state: a.state, country: a.country || "IN", pincode: a.postalCode };
}

async function resolveWarehouse(warehouseId: string | null): Promise<Warehouse> {
  const warehouse = warehouseId
    ? await db.warehouse.findUnique({ where: { id: warehouseId } })
    : await db.warehouse.findFirst({ where: { isDefault: true, isActive: true } });

  if (!warehouse) throw new Error("No pickup warehouse configured. Set a Default Warehouse in Admin → Shipping.");
  if (!warehouse.pincode || !warehouse.city || !warehouse.address) {
    throw new Error(`Warehouse "${warehouse.name}" is missing pickup address details. Complete it in Admin → Inventory → Warehouses.`);
  }
  if (!warehouse.phone) {
    throw new Error(`Warehouse "${warehouse.name}" is missing a contact phone number for Shiprocket pickup.`);
  }
  return warehouse;
}

async function buildCreateShipmentRequest(order: OrderWithItems, warehouse: Warehouse): Promise<CreateShipmentRequest> {
  const settings = await getShippingProviderSettings();

  if (order.paymentMethod === "COD" && !settings.codEnabled) throw new Error("COD is disabled in Admin → Shipping settings.");
  if (order.paymentMethod !== "COD" && !settings.prepaidEnabled) throw new Error("Prepaid shipping is disabled in Admin → Shipping settings.");

  const shippingAddress = addressFromJson(order.shippingAddress);
  const billingAddress = order.billingAddress ? addressFromJson(order.billingAddress) : shippingAddress;
  const addr = order.shippingAddress as { fullName?: string; phone?: string };

  const contactPhone = order.guestPhone || addr.phone;
  const contactName = addr.fullName;
  if (!contactPhone || !contactName) throw new Error("Order is missing a recipient name or phone number — cannot create a shipment.");

  if (order.items.length === 0) throw new Error("Order has no items — cannot create a shipment.");

  const variantIds = order.items.map((i) => i.variantId);
  const variants = await db.productVariant.findMany({ where: { id: { in: variantIds } } });
  const weightByVariant = new Map(variants.map((v) => [v.id, v.weightGrams]));

  for (const item of order.items) {
    if (!item.sku) throw new Error(`Item "${item.productName}" is missing a SKU — cannot create a shipment.`);
  }

  const items = order.items.map((item) => ({
    name: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    price: Number(item.price),
    tax: Number(item.gstRate ?? 0),
    weightGrams: weightByVariant.get(item.variantId) || settings.defaultPackageWeightGrams,
  }));

  const packageWeightGrams = items.reduce((sum, i) => sum + i.weightGrams * i.quantity, 0) || settings.defaultPackageWeightGrams;
  const isCod = order.paymentMethod === "COD";

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customer: { name: contactName, phone: contactPhone, email: order.guestEmail || undefined },
    billingAddress,
    shippingAddress,
    items,
    subtotal: Number(order.subtotal),
    discount: Number(order.discountAmount),
    shippingFee: Number(order.shippingFee),
    total: Number(order.total),
    paymentMethod: isCod ? "COD" : "PREPAID",
    codAmount: isCod ? Number(order.total) : 0,
    pickupLocation: {
      label: warehouse.shiprocketPickupLocation || warehouse.name,
      contact: { name: warehouse.contactName || warehouse.name, phone: warehouse.phone!, email: warehouse.email || undefined },
      address: {
        line1: warehouse.address!,
        line2: warehouse.addressLine2 || undefined,
        city: warehouse.city!,
        state: warehouse.state || undefined,
        country: warehouse.country || "IN",
        pincode: warehouse.pincode!,
      },
    },
    packageWeightGrams,
    dimensionsCm: settings.defaultDimensionsCm,
  };
}

async function loadOrder(orderId: string): Promise<OrderWithItems> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("Order not found.");
  return order;
}

async function getOrCreateShipmentRow(orderId: string): Promise<Shipment> {
  return db.shipment.upsert({
    where: { orderId },
    update: {},
    create: { orderId, provider: "SHIPROCKET" },
  });
}

async function recordFailure(orderId: string, err: unknown): Promise<never> {
  const message = err instanceof Error ? err.message : "Unknown error creating shipment.";
  await db.shipment.upsert({
    where: { orderId },
    update: { lastApiStatus: "FAILED", errorMessage: message, retryCount: { increment: 1 } },
    create: { orderId, provider: "SHIPROCKET", lastApiStatus: "FAILED", errorMessage: message, retryCount: 1 },
  });
  throw err instanceof Error ? err : new Error(message);
}

/** Idempotent — returns the existing shipment untouched if Shiprocket already has an order for it. */
export async function createShipmentStep(orderId: string): Promise<Shipment> {
  const existing = await db.shipment.findUnique({ where: { orderId } });
  if (existing?.shiprocketShipmentId) return existing;

  try {
    const order = await loadOrder(orderId);
    const settings = await getShippingProviderSettings();
    const warehouse = await resolveWarehouse(settings.defaultWarehouseId);
    const request = await buildCreateShipmentRequest(order, warehouse);
    const provider = getShippingProvider("SHIPROCKET");

    const result = await provider.createShipment(request);

    const shipment = await db.shipment.upsert({
      where: { orderId },
      update: {
        provider: "SHIPROCKET",
        warehouseId: warehouse.id,
        shiprocketOrderId: result.providerOrderId,
        shiprocketShipmentId: result.providerShipmentId,
        packageWeight: request.packageWeightGrams / 1000,
        packageLength: request.dimensionsCm.length,
        packageWidth: request.dimensionsCm.width,
        packageHeight: request.dimensionsCm.height,
        codAmount: request.codAmount,
        lastApiStatus: "SUCCESS",
        errorMessage: null,
      },
      create: {
        orderId,
        provider: "SHIPROCKET",
        warehouseId: warehouse.id,
        shiprocketOrderId: result.providerOrderId,
        shiprocketShipmentId: result.providerShipmentId,
        packageWeight: request.packageWeightGrams / 1000,
        packageLength: request.dimensionsCm.length,
        packageWidth: request.dimensionsCm.width,
        packageHeight: request.dimensionsCm.height,
        codAmount: request.codAmount,
        lastApiStatus: "SUCCESS",
      },
    });

    await db.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: "SHIPMENT_CREATED", occurredAt: new Date(), source: "MANUAL", raw: result.raw as never },
    });

    return shipment;
  } catch (err) {
    return recordFailure(orderId, err);
  }
}

export async function assignAwbStep(orderId: string): Promise<Shipment> {
  const shipment = await getOrCreateShipmentRow(orderId);
  if (shipment.awbCode) return shipment;
  if (!shipment.shiprocketShipmentId) throw new Error("Create the Shiprocket shipment before assigning an AWB.");

  const settings = await getShippingProviderSettings();
  const provider = getShippingProvider("SHIPROCKET");

  try {
    const result = await provider.assignAwb(shipment.shiprocketShipmentId, settings.preferredCourierId || undefined);
    const updated = await db.shipment.update({
      where: { orderId },
      data: {
        awbCode: result.awbCode,
        courierId: result.courierId,
        courierName: result.courierName,
        carrier: result.courierName,
        trackingNumber: result.awbCode,
        lastApiStatus: "SUCCESS",
        errorMessage: null,
      },
    });
    await db.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: "AWB_ASSIGNED", occurredAt: new Date(), source: "MANUAL", raw: result.raw as never },
    });
    return updated;
  } catch (err) {
    return recordFailure(orderId, err);
  }
}

export async function generateLabelStep(orderId: string): Promise<Shipment> {
  const shipment = await getOrCreateShipmentRow(orderId);
  if (shipment.labelUrl) return shipment;
  if (!shipment.shiprocketShipmentId) throw new Error("Create the Shiprocket shipment before generating a label.");

  const provider = getShippingProvider("SHIPROCKET");
  try {
    const result = await provider.generateLabel(shipment.shiprocketShipmentId);
    const updated = await db.shipment.update({
      where: { orderId },
      data: { labelUrl: result.labelUrl, lastApiStatus: "SUCCESS", errorMessage: null },
    });
    await db.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: "LABEL_GENERATED", occurredAt: new Date(), source: "MANUAL", raw: result.raw as never },
    });
    return updated;
  } catch (err) {
    return recordFailure(orderId, err);
  }
}

export async function schedulePickupStep(orderId: string): Promise<Shipment> {
  const shipment = await getOrCreateShipmentRow(orderId);
  if (shipment.pickupScheduledAt) return shipment;
  if (!shipment.shiprocketShipmentId) throw new Error("Create the Shiprocket shipment before scheduling pickup.");

  const provider = getShippingProvider("SHIPROCKET");
  try {
    const result = await provider.schedulePickup(shipment.shiprocketShipmentId);
    const updated = await db.shipment.update({
      where: { orderId },
      data: {
        pickupScheduledAt: result.pickupDate ? new Date(result.pickupDate) : new Date(),
        pickupStatus: result.status,
        lastApiStatus: "SUCCESS",
        errorMessage: null,
      },
    });
    await db.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: "PICKUP_SCHEDULED", occurredAt: new Date(), source: "MANUAL", raw: result.raw as never },
    });
    return updated;
  } catch (err) {
    return recordFailure(orderId, err);
  }
}

export async function cancelShipmentStep(orderId: string): Promise<Shipment> {
  const shipment = await db.shipment.findUnique({ where: { orderId } });
  if (!shipment?.shiprocketShipmentId) throw new Error("There's no Shiprocket shipment to cancel.");

  const provider = getShippingProvider("SHIPROCKET");
  const result = await provider.cancel(shipment.shiprocketShipmentId);

  const updated = await db.shipment.update({
    where: { orderId },
    data: { pickupStatus: "CANCELLED", trackingStatus: "CANCELLED", lastApiStatus: "SUCCESS" },
  });
  await db.shipmentEvent.create({
    data: { shipmentId: shipment.id, status: "CANCELLED", occurredAt: new Date(), source: "MANUAL", raw: result.raw as never },
  });
  return updated;
}

/** Chains create → AWB → label → pickup according to automation settings. Never throws — callers just want it attempted. */
async function runAutomationChain(orderId: string, settings: Awaited<ReturnType<typeof getShippingProviderSettings>>): Promise<void> {
  try {
    await createShipmentStep(orderId);
  } catch (err) {
    console.error("[shipping/orchestrator] createShipmentStep failed", err);
    return;
  }
  if (settings.automation.autoAssignAwb) {
    try {
      await assignAwbStep(orderId);
    } catch (err) {
      console.error("[shipping/orchestrator] assignAwbStep failed", err);
      return;
    }
  }
  if (settings.automation.autoGenerateLabel) {
    try {
      await generateLabelStep(orderId);
    } catch (err) {
      console.error("[shipping/orchestrator] generateLabelStep failed", err);
      return;
    }
  }
  if (settings.automation.autoSchedulePickup) {
    try {
      await schedulePickupStep(orderId);
    } catch (err) {
      console.error("[shipping/orchestrator] schedulePickupStep failed", err);
    }
  }
}

/**
 * Called after payment confirmation (prepaid) or order placement (COD).
 * Wrapped by callers in try/catch too, but never throws itself — a Shiprocket
 * outage must never fail the checkout/payment flow that calls this.
 */
export async function maybeAutoCreateShipment(orderId: string): Promise<void> {
  try {
    const settings = await getShippingProviderSettings();
    if (settings.activeProvider !== "SHIPROCKET" || !settings.automation.autoCreateShipment) return;
    await runAutomationChain(orderId, settings);
  } catch (err) {
    console.error("[shipping/orchestrator] maybeAutoCreateShipment failed", err);
  }
}

/** Admin "Retry Shipment" — resumes the chain regardless of the autoCreateShipment toggle. */
export async function retryShipment(orderId: string): Promise<void> {
  const settings = await getShippingProviderSettings();
  if (settings.activeProvider !== "SHIPROCKET") throw new Error("Switch Active Provider to Shiprocket in Admin → Shipping first.");
  await runAutomationChain(orderId, settings);
}

/** Ingests tracking events from a webhook, cron poll, or manual "Track Shipment" click — shared so all three sources behave identically. */
export async function ingestTrackingEvents(shipmentId: string, events: TrackingEvent[], source: "WEBHOOK" | "POLL" | "MANUAL", raw?: unknown): Promise<void> {
  for (const event of events) {
    try {
      await db.shipmentEvent.create({
        data: { shipmentId, status: event.status, location: event.location, activity: event.activity, occurredAt: event.occurredAt, source, raw: raw as never },
      });
    } catch (err) {
      // Unique [shipmentId, status, occurredAt] violation — already recorded, safe to ignore.
      if (!(err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002")) throw err;
    }
  }

  const latest = await db.shipmentEvent.findFirst({ where: { shipmentId }, orderBy: { occurredAt: "desc" } });
  if (!latest) return;

  const classification = classifyShiprocketStatus(latest.status);
  const shipment = await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } });

  await db.shipment.update({
    where: { id: shipmentId },
    data: {
      trackingStatus: latest.status,
      deliveryException: classification.deliveryException ?? shipment.deliveryException,
      lastTrackingSyncAt: new Date(),
      shippedAt: classification.timelineStep === "PICKED_UP" && !shipment.shippedAt ? latest.occurredAt : undefined,
      deliveredAt: classification.orderStatus === "DELIVERED" && !shipment.deliveredAt ? latest.occurredAt : undefined,
    },
  });

  if (!classification.orderStatus) return;

  const order = await db.order.findUniqueOrThrow({ where: { id: shipment.orderId } });
  const newRank = STATUS_RANK[classification.orderStatus];
  const currentRank = STATUS_RANK[order.status];
  const isForwardProgress = newRank === undefined || currentRank === undefined || newRank > currentRank;
  const isTerminalException = classification.orderStatus === "CANCELLED" || classification.orderStatus === "RETURNED";

  if ((isForwardProgress || isTerminalException) && order.status !== classification.orderStatus) {
    await applyOrderStatus(order.id, classification.orderStatus, `Updated by courier: ${latest.status}`);
  }
}

/** Manual "Track Shipment" button + the fallback cron poll both call this for one shipment. */
export async function trackShipmentStep(orderId: string, source: "MANUAL" | "POLL" = "MANUAL"): Promise<Shipment> {
  const shipment = await db.shipment.findUnique({ where: { orderId } });
  if (!shipment?.awbCode) throw new Error("No AWB assigned yet — nothing to track.");

  const provider = getShippingProvider("SHIPROCKET");
  const result = await provider.track(shipment.awbCode);
  await ingestTrackingEvents(shipment.id, result.events, source, result.raw);

  return db.shipment.findUniqueOrThrow({ where: { orderId } });
}
