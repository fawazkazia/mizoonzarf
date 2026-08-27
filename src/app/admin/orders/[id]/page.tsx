import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/currency";
import { OrderStatusUpdater } from "./OrderStatusUpdater";
import { OrderSecurityPanel } from "./OrderSecurityPanel";
import { ShiprocketPanel } from "./ShiprocketPanel";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { ButtonLink } from "@/components/ui/Button";
import { getShippingProviderSettings } from "@/lib/shipping/settings";

export const metadata = { title: "Order Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [order, shippingSettings, settings] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        shipment: { include: { events: { orderBy: { occurredAt: "desc" } } } },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    }),
    getShippingProviderSettings(),
    getSettings(),
  ]);

  if (!order) notFound();
  const isShiprocketActive = shippingSettings.activeProvider === "SHIPROCKET";
  const brand = settings.promoStrips.brandsBanner;
  const gradient = `linear-gradient(90deg, ${brand.gradientFrom}, ${brand.gradientVia}, ${brand.gradientTo})`;
  const accent = brand.gradientVia;

  const address = order.shippingAddress as { fullName: string; phone: string; line1: string; line2?: string; city: string; country: string };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Order {order.orderNumber}</h1>
          <p className="text-sm text-ink-soft">Placed {order.createdAt.toLocaleString()}</p>
        </div>
        <div className="flex gap-3">
          <ButtonLink href={`/admin/orders/${order.id}/pack`} variant="secondary">
            Pack Order
          </ButtonLink>
          <ButtonLink href={`/admin/orders/${order.id}/invoice`} variant="secondary" target="_blank" rel="noopener">
            View Invoice
          </ButtonLink>
        </div>
      </div>

      <OrderTimeline status={order.status} paymentStatus={order.paymentStatus} gradient={gradient} accent={accent} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="border border-line p-5">
            <h2 className="mb-4 font-display text-lg">Items</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.productName} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
                  </span>
                  <span>{formatINR(Number(item.subtotal))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{formatINR(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Discount</span>
                <span>-{formatINR(Number(order.discountAmount))}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Shipping</span>
                <span>{formatINR(Number(order.shippingFee))}</span>
              </div>
              {Number(order.cgstAmount) > 0 && (
                <>
                  <div className="flex justify-between text-ink-soft">
                    <span>CGST</span>
                    <span>{formatINR(Number(order.cgstAmount))}</span>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <span>SGST</span>
                    <span>{formatINR(Number(order.sgstAmount))}</span>
                  </div>
                </>
              )}
              {Number(order.igstAmount) > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <span>IGST</span>
                  <span>{formatINR(Number(order.igstAmount))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2 font-medium">
                <span>Total</span>
                <span>{formatINR(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <div className="border border-line p-5">
            <h2 className="mb-4 font-display text-lg">Customer & Delivery</h2>
            <p className="text-sm">
              {order.user ? (
                <Link href={`/admin/customers/${order.user.id}`} className="hover:underline">
                  {order.user.name} ({order.user.email})
                </Link>
              ) : (
                <>Guest — {order.guestEmail}</>
              )}
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 && <>, {address.line2}</>}
              <br />
              {address.city}, {address.country}
              <br />
              {address.phone}
            </p>
            <p className="mt-3 text-xs uppercase tracking-wide text-ink-soft">
              Delivery: {order.deliveryMethod} · Payment: {order.paymentMethod.replace(/_/g, " ")}
            </p>
            {order.notes && <p className="mt-3 text-sm italic text-ink-soft">Note: {order.notes}</p>}
          </div>

          <div className="border border-line p-5">
            <h2 className="mb-4 font-display text-lg">Status History</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex justify-between border-b border-line pb-2 last:border-0">
                  <span>
                    {h.status.replace(/_/g, " ")} {h.note && `— ${h.note}`}
                  </span>
                  <span className="text-ink-soft">{h.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <OrderSecurityPanel
            riskLevel={order.riskLevel}
            riskReasons={order.riskReasons}
            phone={address.phone ?? null}
            phoneVerified={order.phoneVerified}
            paymentMethod={order.paymentMethod}
            codConfirmedAt={order.codConfirmedAt}
          />
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
            paymentMethod={order.paymentMethod}
            shipment={{
              carrier: order.shipment?.carrier ?? "",
              trackingNumber: order.shipment?.trackingNumber ?? "",
              estimatedDelivery: order.shipment?.estimatedDelivery ? order.shipment.estimatedDelivery.toISOString().slice(0, 10) : "",
            }}
          />
          {isShiprocketActive && (
            <ShiprocketPanel
              orderId={order.id}
              orderNumber={order.orderNumber}
              paymentStatus={order.paymentStatus}
              shipment={
                order.shipment
                  ? {
                      shiprocketOrderId: order.shipment.shiprocketOrderId,
                      shiprocketShipmentId: order.shipment.shiprocketShipmentId,
                      awbCode: order.shipment.awbCode,
                      courierName: order.shipment.courierName,
                      labelUrl: order.shipment.labelUrl,
                      pickupStatus: order.shipment.pickupStatus,
                      pickupScheduledAt: order.shipment.pickupScheduledAt ? order.shipment.pickupScheduledAt.toISOString() : null,
                      trackingStatus: order.shipment.trackingStatus,
                      deliveryException: order.shipment.deliveryException,
                      errorMessage: order.shipment.errorMessage,
                      lastApiStatus: order.shipment.lastApiStatus,
                    }
                  : null
              }
              events={(order.shipment?.events ?? []).map((e) => ({ status: e.status, occurredAt: e.occurredAt.toISOString(), location: e.location, activity: e.activity }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
