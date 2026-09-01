import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";
import { formatINR } from "@/lib/currency";

export interface OrderInfoPanelData {
  id: string;
  orderNumber: string;
  createdAt: Date;
  items: { id: string; productName: string; variantLabel: string | null; quantity: number; price: number; subtotal: number; imageUrl: string | null }[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  shippingAddress: { fullName: string; line1: string; line2?: string; city: string; country: string; phone: string } | null;
  trackingNumber: string | null;
  courierName: string | null;
  estimatedDelivery: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  returnStatus: string | null;
  refundStatus: string | null;
}

/** Condensed — never receives Payment.rawResponse. Links out to the full order page for
 * anything not shown here (spec: staff shouldn't have to leave Customer Care for the basics). */
export function OrderInfoPanel({ order }: { order: OrderInfoPanelData }) {
  return (
    <div className="border border-line p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg">Order Info</h2>
        <Link href={`/admin/orders/${order.id}`} className="text-xs uppercase tracking-wide underline">
          View Full Order
        </Link>
      </div>
      <p className="text-sm font-medium">{order.orderNumber}</p>
      <p className="text-xs text-ink-soft">Placed {order.createdAt.toLocaleString()}</p>

      <ul className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden border border-line bg-paper-dim">
              <Img src={item.imageUrl} alt={item.productName} />
            </div>
            <span className="flex-1">
              {item.productName} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
            </span>
            <span>{formatINR(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-xs text-ink-soft">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatINR(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatINR(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatINR(order.shippingFee)}</span>
        </div>
        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatINR(order.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-1 font-medium text-ink">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-xs text-ink-soft">
        <p>
          Payment: <span className="text-ink">{order.paymentMethod.replace(/_/g, " ")}</span> — {order.paymentStatus.replace(/_/g, " ")}
        </p>
        <p>
          Order Status: <span className="text-ink">{order.status.replace(/_/g, " ")}</span>
        </p>
        {order.trackingNumber && (
          <p>
            Tracking: <span className="text-ink">{order.trackingNumber}</span> {order.courierName && `(${order.courierName})`}
          </p>
        )}
        {order.estimatedDelivery && <p>Est. Delivery: {order.estimatedDelivery.toLocaleDateString()}</p>}
        {order.shippingAddress && (
          <p>
            Deliver to: {order.shippingAddress.fullName}, {order.shippingAddress.line1}
            {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}, {order.shippingAddress.city}
          </p>
        )}
        {order.cancelledAt && (
          <p className="text-sale">
            Cancelled {order.cancelledAt.toLocaleDateString()} {order.cancellationReason && `— ${order.cancellationReason}`}
          </p>
        )}
        {order.returnStatus && <p>Return Status: <span className="text-ink">{order.returnStatus.replace(/_/g, " ")}</span></p>}
        {order.refundStatus && <p>Refund Status: <span className="text-ink">{order.refundStatus.replace(/_/g, " ")}</span></p>}
      </div>
    </div>
  );
}
