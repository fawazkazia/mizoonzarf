import { db } from "@/lib/db";
import { getShippingProviderSettings } from "@/lib/shipping/settings";
import { ShiprocketSettingsForm } from "./ShiprocketSettingsForm";

export const metadata = { title: "Shipping" };

function maskEmail(email: string | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 1)}${"•".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export default async function AdminShippingPage() {
  const [settings, warehouses] = await Promise.all([
    getShippingProviderSettings(),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } }),
  ]);

  const configured = Boolean(process.env.SHIPROCKET_API_TOKEN || (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD));
  const mode: "test" | "production" = process.env.SHIPROCKET_MODE === "production" ? "production" : "test";
  const emailHint = process.env.SHIPROCKET_API_TOKEN ? "API token" : maskEmail(process.env.SHIPROCKET_EMAIL);

  const [failedShipments, recentEvents] = await Promise.all([
    db.shipment.findMany({
      where: { provider: "SHIPROCKET", lastApiStatus: "FAILED" },
      include: { order: { select: { orderNumber: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.shipmentEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { shipment: { select: { orderId: true, order: { select: { orderNumber: true } } } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Shipping</h1>
        <p className="mt-1 text-sm text-ink-soft">Configure Shiprocket as the store&apos;s courier provider.</p>
      </div>

      <ShiprocketSettingsForm
        initial={settings}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name, hasPickupAddress: Boolean(w.pincode && w.city && w.address && w.phone) }))}
        credentialStatus={{ configured, mode, emailHint }}
        failedShipments={failedShipments.map((s) => ({
          id: s.id,
          orderId: s.orderId,
          orderNumber: s.order.orderNumber,
          errorMessage: s.errorMessage,
          retryCount: s.retryCount,
          updatedAt: s.updatedAt.toISOString(),
        }))}
        recentEvents={recentEvents.map((e) => ({
          id: e.id,
          orderNumber: e.shipment.order.orderNumber,
          status: e.status,
          source: e.source,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
