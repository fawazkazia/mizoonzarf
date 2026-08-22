import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const HAPPY_PATH = ["ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

const LABELS: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export function OrderTimeline({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "REFUNDED" || status === "RETURNED" || status === "RETURN_REQUESTED") {
    return (
      <div className="border border-line bg-paper-dim p-4 text-center text-sm">
        This order is <strong>{LABELS[status] ?? status.replace(/_/g, " ")}</strong>.
      </div>
    );
  }

  const currentIndex = HAPPY_PATH.indexOf(status as (typeof HAPPY_PATH)[number]);

  return (
    <ol className="flex flex-wrap gap-y-6">
      {HAPPY_PATH.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <li key={step} className="flex flex-1 min-w-[110px] flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <div className={cn("h-px flex-1", i === 0 ? "opacity-0" : done ? "bg-ink" : "bg-line")} />
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs",
                  done ? "border-ink bg-ink text-paper" : "border-line text-ink-soft"
                )}
              >
                {done ? <Check size={13} /> : i + 1}
              </div>
              <div className={cn("h-px flex-1", i === HAPPY_PATH.length - 1 ? "opacity-0" : done && i < currentIndex ? "bg-ink" : "bg-line")} />
            </div>
            <span className={cn("text-[11px] uppercase tracking-wide", done ? "text-ink" : "text-ink-soft/60")}>{LABELS[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}
