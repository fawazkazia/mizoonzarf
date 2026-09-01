import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShoppingBag, MapPin, CreditCard, ShieldCheck, XCircle, Clock3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/currency";
import { Img } from "@/components/ui/ArtImage";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { ReturnItemAction } from "@/components/account/ReturnItemAction";
import { CancelOrderAction } from "@/components/account/CancelOrderAction";
import { CompletePaymentButton } from "@/components/orders/CompletePaymentButton";
import { CANCELLABLE_ORDER_STATUSES } from "@/lib/orders/cancel";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_MESSAGES: Record<string, string> = {
  ORDER_PLACED: "Your order has been placed successfully.",
  PAYMENT_CONFIRMED: "Your payment has been confirmed.",
  PROCESSING: "Your order is being processed.",
  PACKED: "Your order has been packed and is ready for dispatch.",
  SHIPPED: "Your order is on the way.",
  OUT_FOR_DELIVERY: "Your order is out for delivery.",
  DELIVERED: "Your order has been delivered.",
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const [order, settings] = await Promise.all([
    db.order.findFirst({
      where: { id, userId: session!.user.id },
      include: {
        items: {
          include: {
            returns: true,
            product: { select: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
            variant: { select: { imageUrl: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        shipment: { include: { events: { orderBy: { occurredAt: "desc" } } } },
      },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  const address = order.shippingAddress as { fullName: string; line1: string; line2?: string; city: string; country: string; phone: string };
  const shipment = order.shipment;
  const brand = settings.promoStrips.brandsBanner;
  const gradient = `linear-gradient(90deg, ${brand.gradientFrom}, ${brand.gradientVia}, ${brand.gradientTo})`;
  const accent = brand.gradientVia;
  const statusMessage = STATUS_MESSAGES[order.status];
  // COD is never "paid" ahead of delivery by design, so a PENDING COD order is the
  // normal happy path — only a prepaid method sitting at PENDING actually needs action.
  const paymentPending = order.paymentStatus === "PENDING" && order.paymentMethod !== "COD";
  const paymentFailed = order.paymentStatus === "FAILED";
  const canCancel = CANCELLABLE_ORDER_STATUSES.includes(order.status);

  return (
    <div>
      <Link href="/account/orders" className="mb-4 inline-flex items-center gap-1 text-xs font-medium" style={{ color: accent }}>
        <ChevronLeft size={14} strokeWidth={2} />
        Back to Orders
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl">Order {order.orderNumber}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Placed on {order.createdAt.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}
        </p>
        {canCancel && (
          <div className="mt-3">
            <CancelOrderAction orderId={order.id} orderNumber={order.orderNumber} canCancel={canCancel} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-paper-raise p-4 shadow-[var(--shadow-lift)] sm:p-6">
        <OrderTimeline
          status={order.status}
          paymentStatus={order.paymentStatus}
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
          gradient={gradient}
          accent={accent}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line bg-paper-raise shadow-[var(--shadow-lift)]">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}14`, color: accent }}>
                <ShoppingBag size={17} strokeWidth={1.75} />
              </span>
              <h2 className="font-display text-lg">Order Summary</h2>
            </div>

            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft">Items</p>
            <ul className="flex flex-col gap-3.5">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-dim">
                    <Img src={item.variant.imageUrl ?? item.product.images[0]?.url} alt={item.productName} seedFallback={item.variantId} />
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {item.productName} {item.variantLabel && <span className="font-normal text-ink-soft">({item.variantLabel})</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">Qty: {item.quantity}</p>
                      <ReturnItemAction orderItemId={item.id} canReturn={order.status === "DELIVERED"} alreadyRequested={item.returns.length > 0} />
                    </div>
                    <span className="shrink-0 text-sm font-medium">{formatINR(Number(item.subtotal))}</span>
                  </div>
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
              <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                <span className="font-medium">Total</span>
                <span className="text-lg font-semibold" style={{ color: accent }}>
                  {formatINR(Number(order.total))}
                </span>
              </div>
            </div>
          </div>

          {order.status === "CANCELLED" ? (
            <div className="flex items-center gap-3 bg-sale/10 px-5 py-4 text-sm font-medium text-sale sm:px-6">
              <XCircle size={18} className="shrink-0" strokeWidth={1.75} />
              This order was cancelled{order.cancellationReason ? ` — ${order.cancellationReason}` : ""}.
            </div>
          ) : paymentFailed ? (
            <div className="flex items-center gap-3 bg-sale/10 px-5 py-4 text-sm font-medium text-sale sm:px-6">
              <XCircle size={18} className="shrink-0" strokeWidth={1.75} />
              Payment failed — this order was cancelled.
            </div>
          ) : paymentPending ? (
            <div className="flex flex-col gap-3 bg-gold-soft/25 px-5 py-4 text-sm font-medium sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="flex items-center gap-3 text-gold-deep">
                <Clock3 size={18} className="shrink-0" strokeWidth={1.75} />
                Your order is placed — complete payment to confirm it.
              </span>
              <CompletePaymentButton orderId={order.id} orderNumber={order.orderNumber} gradient={gradient} />
            </div>
          ) : (
            statusMessage && (
              <div className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-paper sm:px-6" style={{ backgroundImage: gradient }}>
                <ShieldCheck size={18} className="shrink-0" strokeWidth={1.75} />
                {statusMessage}
              </div>
            )
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-paper-raise p-5 shadow-[var(--shadow-lift)] sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}14`, color: accent }}>
                <MapPin size={17} strokeWidth={1.75} />
              </span>
              <h2 className="font-display text-lg">Delivery &amp; Payment Details</h2>
            </div>

            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: accent }}>
              Delivery Address
            </p>
            <p className="text-sm leading-relaxed">
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 && <>, {address.line2}</>}
              <br />
              {address.city}, {address.country}
              <br />
              {address.phone}
            </p>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: accent }}>
                Payment Method
              </p>
              <div className="flex items-center gap-2.5 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-dim">
                  <CreditCard size={15} strokeWidth={1.75} className="text-ink-soft" />
                </span>
                {order.paymentMethod.replace(/_/g, " ")}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-paper-dim p-3.5">
              <ShieldCheck size={18} className="shrink-0 text-success" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-medium">Secure Checkout</p>
                <p className="text-xs text-ink-soft">Your information is safe and encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
