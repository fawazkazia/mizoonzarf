"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShipmentTimeline, type ShipmentTimelineEvent } from "@/components/admin/ShipmentTimeline";
import {
  assignAwbAction,
  cancelShipmentAction,
  createShipmentAction,
  generateLabelAction,
  retryShipmentAction,
  schedulePickupAction,
  trackShipmentAction,
} from "./shipping-actions";

export interface ShiprocketPanelShipment {
  shiprocketOrderId: string | null;
  shiprocketShipmentId: string | null;
  awbCode: string | null;
  courierName: string | null;
  labelUrl: string | null;
  pickupStatus: string | null;
  pickupScheduledAt: string | null;
  trackingStatus: string | null;
  deliveryException: string | null;
  errorMessage: string | null;
  lastApiStatus: string | null;
}

interface Props {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  shipment: ShiprocketPanelShipment | null;
  events: ShipmentTimelineEvent[];
}

type ActionKey = "create" | "awb" | "label" | "pickup" | "track" | "cancel" | "retry";

export function ShiprocketPanel({ orderId, orderNumber, paymentStatus, shipment, events }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<ActionKey | null>(null);

  async function run(key: ActionKey, action: () => Promise<void>, successMessage: string) {
    setPending(key);
    try {
      await action();
      toast.success(successMessage);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setPending(null);
    }
  }

  const hasShipment = Boolean(shipment?.shiprocketShipmentId);
  const hasAwb = Boolean(shipment?.awbCode);
  const hasLabel = Boolean(shipment?.labelUrl);
  const hasPickup = Boolean(shipment?.pickupScheduledAt);
  const isCancelled = shipment?.pickupStatus === "CANCELLED";

  return (
    <div className="border border-line p-5">
      <h2 className="mb-4 font-display text-lg">Shipping (Shiprocket)</h2>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-ink-soft">Order</dt>
        <dd>{orderNumber}</dd>
        <dt className="text-ink-soft">Payment</dt>
        <dd>{paymentStatus.replace(/_/g, " ")}</dd>
        <dt className="text-ink-soft">Shipment Status</dt>
        <dd>
          {isCancelled ? (
            <Badge tone="sale">Cancelled</Badge>
          ) : (
            <Badge tone={hasShipment ? "success" : "outline"}>{shipment?.trackingStatus ?? (hasShipment ? "Ready to Ship" : "Not Created")}</Badge>
          )}
        </dd>
        <dt className="text-ink-soft">Shiprocket Order ID</dt>
        <dd>{shipment?.shiprocketOrderId ?? "—"}</dd>
        <dt className="text-ink-soft">Shipment ID</dt>
        <dd>{shipment?.shiprocketShipmentId ?? "—"}</dd>
        <dt className="text-ink-soft">AWB</dt>
        <dd>{shipment?.awbCode ?? "—"}</dd>
        <dt className="text-ink-soft">Courier</dt>
        <dd>{shipment?.courierName ?? "—"}</dd>
        <dt className="text-ink-soft">Label</dt>
        <dd>
          {!shipment?.labelUrl ? (
            "Not generated"
          ) : shipment.labelUrl.includes("example.invalid") ? (
            <span className="text-ink-soft">Generated (test mode — not a real file; switch SHIPROCKET_MODE to production for a real label)</span>
          ) : (
            <a href={shipment.labelUrl} target="_blank" rel="noopener" className="underline">
              View Label
            </a>
          )}
        </dd>
        <dt className="text-ink-soft">Pickup</dt>
        <dd>{shipment?.pickupStatus ?? (hasPickup ? "Scheduled" : "Not scheduled")}</dd>
      </dl>

      {shipment?.errorMessage && (
        <p className="mt-4 border border-sale/40 bg-sale/5 p-3 text-xs text-sale">Shipment creation failed. {shipment.errorMessage}</p>
      )}
      {shipment?.deliveryException && (
        <p className="mt-4 border border-line bg-paper-dim p-3 text-xs text-ink-soft">{shipment.deliveryException}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" disabled={hasShipment || pending !== null} onClick={() => run("create", () => createShipmentAction(orderId), "Shipment created.")}>
          {pending === "create" ? "Creating..." : "Create Shipment"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasShipment || hasAwb || pending !== null}
          onClick={() => run("awb", () => assignAwbAction(orderId), "AWB assigned.")}
        >
          {pending === "awb" ? "Assigning..." : "Assign/Get AWB"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasAwb || hasLabel || pending !== null}
          onClick={() => run("label", () => generateLabelAction(orderId), "Label generated.")}
        >
          {pending === "label" ? "Generating..." : "Generate Label"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasAwb || hasPickup || pending !== null}
          onClick={() => run("pickup", () => schedulePickupAction(orderId), "Pickup scheduled.")}
        >
          {pending === "pickup" ? "Scheduling..." : "Schedule Pickup"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasAwb || pending !== null}
          onClick={() => run("track", () => trackShipmentAction(orderId), "Tracking synced.")}
        >
          {pending === "track" ? "Syncing..." : "Track Shipment"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasShipment || isCancelled || pending !== null}
          onClick={() => run("cancel", () => cancelShipmentAction(orderId), "Shipment cancelled.")}
        >
          {pending === "cancel" ? "Cancelling..." : "Cancel Shipment"}
        </Button>
        <Button size="sm" variant="secondary" disabled={pending !== null} onClick={() => run("retry", () => retryShipmentAction(orderId), "Retried.")}>
          {pending === "retry" ? "Retrying..." : "Retry Shipment"}
        </Button>
      </div>

      {events.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <ShipmentTimeline events={events} deliveryException={shipment?.deliveryException} />
        </div>
      )}
    </div>
  );
}
