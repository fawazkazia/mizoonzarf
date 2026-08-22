import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { OrderTimeline } from "@/components/account/OrderTimeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const [order, settings] = await Promise.all([
    db.order.findFirst({ where: { id, userId: session!.user.id }, include: { items: true, shipment: true } }),
    getSettings(),
  ]);

  if (!order) notFound();

  const address = order.shippingAddress as { fullName: string; line1: string; line2?: string; city: string; country: string; phone: string };

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl">Order {order.orderNumber}</h1>
      <p className="mb-8 text-sm text-ink-soft">
        Placed on {order.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <OrderTimeline status={order.status} />

      {order.shipment?.trackingNumber && (
        <p className="mt-6 text-sm">
          Tracking Number: <strong>{order.shipment.trackingNumber}</strong> {order.shipment.carrier && `via ${order.shipment.carrier}`}
        </p>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="border border-line p-6">
          <h2 className="mb-4 font-display text-xl">Items</h2>
          <ul className="flex flex-col gap-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.productName} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
                </span>
                <span>{settings.currencySymbol} {Number(item.subtotal).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{settings.currencySymbol} {Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{settings.currencySymbol} {Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{settings.currencySymbol} {Number(order.shippingFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>VAT</span>
              <span>{settings.currencySymbol} {Number(order.taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-medium">
              <span>Total</span>
              <span>{settings.currencySymbol} {Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border border-line p-6">
          <h2 className="mb-4 font-display text-xl">Delivery Address</h2>
          <p className="text-sm">
            {address.fullName}
            <br />
            {address.line1}
            {address.line2 && <>, {address.line2}</>}
            <br />
            {address.city}, {address.country}
            <br />
            {address.phone}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.1em] text-ink-soft">Payment Method</p>
          <p className="text-sm">{order.paymentMethod.replace(/_/g, " ")}</p>
        </div>
      </div>
    </div>
  );
}
