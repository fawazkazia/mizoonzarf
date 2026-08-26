"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/currency";
import { OrderTimeline, type OrderTimelineStatusEntry, type OrderTimelineShipment } from "@/components/account/OrderTimeline";

interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  country: string;
  phone: string;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  items: { id: string; productName: string; variantLabel: string | null; quantity: number; subtotal: number }[];
  statusHistory: OrderTimelineStatusEntry[];
  shipment: OrderTimelineShipment | null;
}

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/track-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setResult(data);
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-line p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Order Number</label>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="FK-20260825-1234"
            className="min-h-[44px] w-full border border-line px-4 py-2.5 text-sm uppercase"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-h-[44px] w-full border border-line px-4 py-2.5 text-sm"
          />
        </div>
        <Button type="submit" disabled={loading} className="min-h-[44px] sm:w-auto">
          {loading ? "Searching..." : "Track Order"}
        </Button>
      </form>

      {error && <p className="border border-line bg-paper-dim p-4 text-sm text-sale">{error}</p>}

      {result && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-2 font-display text-2xl">Order {result.orderNumber}</h2>
            <p className="text-sm text-ink-soft">
              Placed on {new Date(result.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <OrderTimeline
            status={result.status}
            statusHistory={result.statusHistory}
            placedAt={result.createdAt}
            shipment={result.shipment}
            paymentMethod={result.paymentMethod}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-line p-5">
              <h3 className="mb-4 font-display text-lg">Items</h3>
              <ul className="flex flex-col gap-3">
                {result.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.productName} {item.variantLabel && `(${item.variantLabel})`} × {item.quantity}
                    </span>
                    <span>{formatINR(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Subtotal</span>
                  <span>{formatINR(result.subtotal)}</span>
                </div>
                {result.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatINR(result.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-soft">
                  <span>Shipping</span>
                  <span>{formatINR(result.shippingFee)}</span>
                </div>
                {result.cgstAmount > 0 && (
                  <>
                    <div className="flex justify-between text-ink-soft">
                      <span>CGST</span>
                      <span>{formatINR(result.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-ink-soft">
                      <span>SGST</span>
                      <span>{formatINR(result.sgstAmount)}</span>
                    </div>
                  </>
                )}
                {result.igstAmount > 0 && (
                  <div className="flex justify-between text-ink-soft">
                    <span>IGST</span>
                    <span>{formatINR(result.igstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-2 font-medium">
                  <span>Total</span>
                  <span>{formatINR(result.total)}</span>
                </div>
              </div>
            </div>

            <div className="border border-line p-5">
              <h3 className="mb-4 font-display text-lg">Delivery Address</h3>
              <p className="text-sm">
                {result.shippingAddress.fullName}
                <br />
                {result.shippingAddress.line1}
                {result.shippingAddress.line2 && <>, {result.shippingAddress.line2}</>}
                <br />
                {result.shippingAddress.city}, {result.shippingAddress.country}
                <br />
                {result.shippingAddress.phone}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.1em] text-ink-soft">Payment Method</p>
              <p className="text-sm">{result.paymentMethod.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
