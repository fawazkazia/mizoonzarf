import { ShoppingBag, CreditCard, Settings2, Package, Truck, Bike, PackageCheck, Check, XCircle, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShipmentTimeline, type ShipmentTimelineEvent } from "@/components/admin/ShipmentTimeline";

const FULL_HAPPY_PATH = ["ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
type Step = (typeof FULL_HAPPY_PATH)[number];
// COD is never explicitly "payment confirmed" by a gateway — it's collected in
// cash on delivery — so that step doesn't apply and would otherwise show as a
// false "done" the moment the order moves past Order Placed.
const COD_HAPPY_PATH: Step[] = FULL_HAPPY_PATH.filter((step) => step !== "PAYMENT_CONFIRMED");

const STEP_META: Record<Step, { label: string; icon: LucideIcon; meaning: string }> = {
  ORDER_PLACED: { label: "Order Placed", icon: ShoppingBag, meaning: "Order successfully received" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed", icon: CreditCard, meaning: "Payment successfully completed" },
  PROCESSING: { label: "Processing", icon: Settings2, meaning: "Your order is being prepared" },
  PACKED: { label: "Packed", icon: Package, meaning: "Package ready for dispatch" },
  SHIPPED: { label: "Shipped", icon: Truck, meaning: "Package has left the warehouse" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: Bike, meaning: "Courier is delivering your package" },
  DELIVERED: { label: "Delivered", icon: PackageCheck, meaning: "Package successfully delivered" },
};

const TERMINAL_LABELS: Record<string, string> = {
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export interface OrderTimelineStatusEntry {
  status: string;
  note?: string | null;
  createdAt: string | Date;
}

export interface OrderTimelineShipment {
  provider?: string | null;
  carrier?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  awbCode?: string | null;
  estimatedDelivery?: string | Date | null;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  trackingStatus?: string | null;
  deliveryException?: string | null;
  events?: ShipmentTimelineEvent[];
}

function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Modern icon-based tracking timeline for the happy path, plus a terminal-state
 * message for cancelled/returned/refunded orders. Every caption is sourced from
 * real OrderStatusHistory rows / shipment data — a step with nothing real to
 * show just shows its title, never a fabricated date or note. */
export function OrderTimeline({
  status,
  statusHistory = [],
  placedAt,
  shipment,
  paymentMethod,
}: {
  status: string;
  statusHistory?: OrderTimelineStatusEntry[];
  placedAt?: string | Date;
  shipment?: OrderTimelineShipment | null;
  paymentMethod?: string;
}) {
  if (status in TERMINAL_LABELS) {
    const Icon = status === "CANCELLED" ? XCircle : RotateCcw;
    return (
      <div className="flex items-center gap-3 border border-line bg-paper-dim p-4 text-sm">
        <Icon size={20} className="shrink-0 text-ink-soft" strokeWidth={1.5} />
        <span>
          This order is <strong>{TERMINAL_LABELS[status]}</strong>.
        </span>
      </div>
    );
  }

  const happyPath: readonly Step[] = paymentMethod === "COD" ? COD_HAPPY_PATH : FULL_HAPPY_PATH;
  // Indexed against the full path so a status this order's own path doesn't
  // contain (e.g. an admin manually setting PAYMENT_CONFIRMED on a COD order)
  // still degrades to "whatever's the latest applicable step" instead of
  // resetting the whole timeline to nothing-done.
  const fullIndex = FULL_HAPPY_PATH.indexOf(status as Step);
  const currentIndex = happyPath.reduce((acc, step, i) => (FULL_HAPPY_PATH.indexOf(step) <= fullIndex ? i : acc), -1);
  // Once delivered there's nothing left "in progress" — every step (including
  // Delivered itself) renders as completed rather than the active/current step.
  const activeIndex = status === "DELIVERED" ? -1 : currentIndex;
  const historyByStatus = new Map(statusHistory.map((h) => [h.status, h]));

  function captionFor(step: Step, done: boolean): string | null {
    const entry = historyByStatus.get(step);

    if (step === "ORDER_PLACED") {
      const at = entry?.createdAt ?? placedAt;
      return at ? formatDateTime(at) : null;
    }
    if (!done) return null;

    if (step === "SHIPPED") {
      const courier = shipment?.courierName || shipment?.carrier;
      if (courier) return shipment?.trackingNumber ? `Via ${courier} · ${shipment.trackingNumber}` : `Via ${courier}`;
    }
    if (step === "OUT_FOR_DELIVERY" && shipment?.estimatedDelivery) {
      return `Estimated by ${formatDate(shipment.estimatedDelivery)}`;
    }
    if (step === "DELIVERED") {
      const at = shipment?.deliveredAt ?? entry?.createdAt;
      if (at) return `Delivered ${formatDateTime(at)}`;
    }

    if (entry) return entry.note ? entry.note : formatDateTime(entry.createdAt);
    return STEP_META[step].meaning;
  }

  const trackUrl = shipment?.provider === "SHIPROCKET" && shipment.awbCode ? `https://shiprocket.co/tracking/${shipment.awbCode}` : null;

  return (
    <div className="@container flex flex-col gap-6">
      <ol className="hidden @4xl:flex">
        {happyPath.map((step, i) => {
          const done = i <= currentIndex;
          const current = i === activeIndex;
          const meta = STEP_META[step];
          const caption = captionFor(step, done);
          return (
            <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-2.5 px-1 text-center">
              <div className="flex w-full items-center">
                <div className={cn("h-0.5 flex-1 transition-colors duration-500", i === 0 ? "opacity-0" : done ? "bg-ink" : "bg-line")} />
                <StepIcon icon={meta.icon} state={current ? "current" : done ? "done" : "upcoming"} />
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-500",
                    i === happyPath.length - 1 ? "opacity-0" : done && i < currentIndex ? "bg-ink" : "bg-line"
                  )}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className={cn("text-[11px] font-medium uppercase tracking-[0.06em]", current || done ? "text-ink" : "text-ink-soft/60")}>
                  {meta.label}
                </span>
                {current && <Badge tone="gold" className="normal-case">Current Status</Badge>}
                {caption && <span className="line-clamp-2 text-[10.5px] leading-snug text-ink-soft">{caption}</span>}
              </div>
            </li>
          );
        })}
      </ol>

      <ol className="flex flex-col @4xl:hidden">
        {happyPath.map((step, i) => {
          const done = i <= currentIndex;
          const current = i === activeIndex;
          const meta = STEP_META[step];
          const caption = captionFor(step, done);
          const isLast = i === happyPath.length - 1;
          return (
            <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[19px] top-10 bottom-0 w-0.5 transition-colors duration-500",
                    i < currentIndex ? "bg-ink" : "bg-line"
                  )}
                />
              )}
              <StepIcon icon={meta.icon} state={current ? "current" : done ? "done" : "upcoming"} />
              <div className="flex-1 pt-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-sm font-medium", current || done ? "text-ink" : "text-ink-soft/70")}>{meta.label}</span>
                  {current && <Badge tone="gold" className="normal-case">Current Status</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">{caption ?? meta.meaning}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {(shipment?.trackingNumber || shipment?.deliveryException) && (
        <div className="border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">{shipment.courierName || shipment.carrier || "Courier"}</p>
              {shipment.trackingNumber && (
                <p className="mt-1 text-sm">
                  Tracking Number: <strong>{shipment.trackingNumber}</strong>
                </p>
              )}
              {shipment.estimatedDelivery && <p className="mt-1 text-xs text-ink-soft">Estimated delivery: {formatDate(shipment.estimatedDelivery)}</p>}
              {shipment.trackingStatus && <p className="mt-1 text-xs text-ink-soft">Status: {shipment.trackingStatus.replace(/_/g, " ")}</p>}
            </div>
            {trackUrl && (
              <ButtonLink href={trackUrl} target="_blank" rel="noopener" size="sm" variant="secondary" className="w-full sm:w-auto">
                Track Package
              </ButtonLink>
            )}
          </div>

          {shipment.deliveryException && <p className="mt-3 border border-line bg-paper-dim p-3 text-xs text-ink-soft">{shipment.deliveryException}</p>}

          {shipment.events && shipment.events.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <ShipmentTimeline events={shipment.events} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepIcon({ icon: Icon, state }: { icon: LucideIcon; state: "done" | "current" | "upcoming" }) {
  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500",
        state === "done" && "border-ink bg-ink text-paper",
        state === "current" && "scale-110 border-gold bg-paper text-gold-deep ring-4 ring-gold/15",
        state === "upcoming" && "border-line bg-paper-dim text-ink-mute"
      )}
    >
      <Icon size={state === "current" ? 17 : 15} strokeWidth={1.75} />
      {state === "done" && (
        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-paper ring-2 ring-paper">
          <Check size={9} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}
