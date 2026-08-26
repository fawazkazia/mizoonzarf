"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Select, Input, Textarea } from "@/components/admin/FormField";
import { updateOrderStatus, updateShipment, updatePaymentStatus, refundPayment } from "../actions";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/client";

const STATUSES: OrderStatus[] = [
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  currentPaymentStatus,
  paymentMethod,
  shipment,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: string;
  paymentMethod: PaymentMethod;
  shipment: { carrier: string; trackingNumber: string; estimatedDelivery: string };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [carrier, setCarrier] = useState(shipment.carrier);
  const [trackingNumber, setTrackingNumber] = useState(shipment.trackingNumber);
  const [estimatedDelivery, setEstimatedDelivery] = useState(shipment.estimatedDelivery);
  const [loading, setLoading] = useState(false);

  async function handleStatusUpdate() {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, status, note || undefined);
      toast.success("Order status updated.");
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update status.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentUpdate() {
    setLoading(true);
    try {
      await updatePaymentStatus(orderId, paymentStatus as (typeof PAYMENT_STATUSES)[number]);
      toast.success("Payment status updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update payment status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund() {
    setLoading(true);
    try {
      await refundPayment(orderId);
      toast.success("Payment refunded.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't refund payment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShipmentUpdate() {
    setLoading(true);
    try {
      await updateShipment(orderId, { carrier, trackingNumber, estimatedDelivery });
      toast.success("Shipment details saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update shipment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-line p-5">
        <h2 className="mb-4 font-display text-lg">Order Status</h2>
        <div className="flex flex-col gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note (optional)">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Button onClick={handleStatusUpdate} disabled={loading} size="sm" className="self-start">
            Update Status
          </Button>
        </div>
      </div>

      <div className="border border-line p-5">
        <h2 className="mb-4 font-display text-lg">Payment</h2>
        {paymentMethod === "COD" ? (
          <div className="flex flex-col gap-3">
            <Field label="Payment Status">
              <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={handlePaymentUpdate} disabled={loading} size="sm" variant="secondary" className="self-start">
              Update Payment Status
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-soft">
              Status: <span className="font-medium text-ink">{currentPaymentStatus.replace(/_/g, " ")}</span> — synced automatically via the payment gateway.
            </p>
            {currentPaymentStatus === "PAID" && (
              <Button onClick={handleRefund} disabled={loading} size="sm" variant="secondary" className="self-start">
                Refund Payment
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="border border-line p-5">
        <h2 className="mb-4 font-display text-lg">Shipment Tracking</h2>
        <div className="flex flex-col gap-3">
          <Field label="Carrier">
            <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Aramex, DHL, ..." />
          </Field>
          <Field label="Tracking Number">
            <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </Field>
          <Field label="Estimated Delivery">
            <Input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
          </Field>
          <Button onClick={handleShipmentUpdate} disabled={loading} size="sm" variant="secondary" className="self-start">
            Save Shipment Details
          </Button>
        </div>
      </div>
    </div>
  );
}
