import { classifyShiprocketStatus, TIMELINE_STEPS } from "@/lib/shipping/status-map";

const STEP_LABELS: Record<(typeof TIMELINE_STEPS)[number], string> = {
  CREATED: "Order Confirmed",
  AWB_ASSIGNED: "AWB Assigned",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Packed & Shipped",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export interface ShipmentTimelineEvent {
  status: string;
  occurredAt: string;
  location?: string | null;
  activity?: string | null;
}

/** Granular carrier tracking timeline — reused by admin order detail and the customer account order page. */
export function ShipmentTimeline({ events, deliveryException }: { events: ShipmentTimelineEvent[]; deliveryException?: string | null }) {
  let furthestIndex = -1;
  for (const event of events) {
    const step = classifyShiprocketStatus(event.status).timelineStep;
    if (!step) continue;
    const idx = TIMELINE_STEPS.indexOf(step);
    if (idx > furthestIndex) furthestIndex = idx;
  }

  const latest = [...events].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5 text-sm">
        {TIMELINE_STEPS.map((step, i) => {
          const done = i <= furthestIndex;
          const current = i === furthestIndex;
          return (
            <li key={step} className="flex items-center gap-2">
              <span className={done ? "text-ink" : "text-ink-soft/50"}>{done ? (current ? "●" : "✓") : "○"}</span>
              <span className={done ? "text-ink" : "text-ink-soft/60"}>{STEP_LABELS[step]}</span>
            </li>
          );
        })}
      </ul>

      {deliveryException && (
        <p className="border border-line bg-paper-dim p-3 text-xs text-ink-soft">{deliveryException}</p>
      )}

      {latest && (
        <p className="text-xs text-ink-soft">
          Latest update: {latest.status.replace(/_/g, " ")}
          {latest.location ? ` — ${latest.location}` : ""} · {new Date(latest.occurredAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
