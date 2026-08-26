import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { ReturnItemAction } from "@/components/account/ReturnItemAction";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const order = await db.order.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      items: { include: { returns: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      shipment: { include: { events: { orderBy: { occurredAt: "desc" } } } },
    },
  });

  if (!order) notFound();

  const address = order.shippingAddress as { fullName: string; line1: string; line2?: string; city: string; country: string; phone: string };
  const shipment = order.shipment;

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl">Order {order.orderNumber}</h1>
      <p className="mb-8 text-sm text-ink-soft">
        Placed on {order.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <OrderTimeline
        status={order.status}
        statusHistory={order.statusHistory}
        placedAt={order.createdAt}
        paymentMethod={order.paymentMethod}
        shipment={
          shipment && {
            provider: shipment.provider,
            carrier: shipment.carrier,
            courierName: shipment.courierName,
            trackingNumber: shipment.trackingNumber,
            awbCode: shipment.awbCode,
            estimatedDelivery: shipment.estimatedDelivery,
            shippedAt: shipment.shippedAt,
            deliveredAt: shipment.deliveredAt,
            trackingStatus: shipment.trackingStatus,
            deliveryException: shipment.deliveryException,
            events: shipment.events.map((e) => ({ status: e.status, occurredAt: e.occurredAt.toISOString(), location: e.location, activity: e.activity })),
          }
        }
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="border border-line p-6">
          <h2 className="mb-4 font-display text-xl">Items</h2>
          <ul className="flex flex-col gap-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <div>
                  <span>
                    {item.productName} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
                  </span>
                  <ReturnItemAction
                    orderItemId={item.id}
                    canReturn={order.status === "DELIVERED"}
                    alreadyRequested={item.returns.length > 0}
                  />
                </div>
                <span>{formatINR(Number(item.subtotal))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatINR(Number(order.subtotal))}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatINR(Number(order.discountAmount))}</span>
              </div>
            )}
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
