import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { OrderStatusUpdater } from "./OrderStatusUpdater";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Order Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        shipment: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  const address = order.shippingAddress as { fullName: string; phone: string; line1: string; line2?: string; city: string; country: string };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Order {order.orderNumber}</h1>
          <p className="text-sm text-ink-soft">Placed {order.createdAt.toLocaleString()}</p>
        </div>
        <ButtonLink href={`/admin/orders/${order.id}/invoice`} variant="secondary" target="_blank" rel="noopener">
          View Invoice
        </ButtonLink>
      </div>

      <OrderTimeline status={order.status} />

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
                  <span>
                    {settings.currencySymbol} {Number(item.subtotal).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>
                  {settings.currencySymbol} {Number(order.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Discount</span>
                <span>
                  -{settings.currencySymbol} {Number(order.discountAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Shipping</span>
                <span>
                  {settings.currencySymbol} {Number(order.shippingFee).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>VAT</span>
                <span>
                  {settings.currencySymbol} {Number(order.taxAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-medium">
                <span>Total</span>
                <span>
                  {settings.currencySymbol} {Number(order.total).toFixed(2)}
                </span>
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

        <OrderStatusUpdater
          orderId={order.id}
          currentStatus={order.status}
          currentPaymentStatus={order.paymentStatus}
          shipment={{
            carrier: order.shipment?.carrier ?? "",
            trackingNumber: order.shipment?.trackingNumber ?? "",
            estimatedDelivery: order.shipment?.estimatedDelivery ? order.shipment.estimatedDelivery.toISOString().slice(0, 10) : "",
          }}
        />
      </div>
    </div>
  );
}
