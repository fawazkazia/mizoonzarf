"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelMyOrder } from "@/app/(storefront)/account/orders/actions";
import { CANCEL_REASONS } from "@/lib/validation/order";
import { Button } from "@/components/ui/Button";

export function CancelOrderForm({ orderId, orderNumber, onDone }: { orderId: string; orderNumber: string; onDone: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const finalReason = description.trim() ? `${reason} — ${description.trim()}` : reason;

  async function handleConfirm() {
    setLoading(true);
    try {
      await cancelMyOrder({ orderId, reason: finalReason });
      toast.success("Your order has been cancelled.");
      onDone();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't cancel this order.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "confirm") {
    return (
      <div className="mt-3 flex flex-col gap-3 border border-sale/30 bg-sale/5 p-4">
        <p className="text-sm font-medium text-ink">Cancel order {orderNumber}?</p>
        <p className="text-sm text-ink-soft">This action cannot be undone. Any payment already made will be refunded automatically.</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" className="bg-sale hover:bg-sale/90" onClick={handleConfirm} disabled={loading}>
            {loading ? "Cancelling..." : "Yes, Cancel Order"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setStep("form")} disabled={loading}>
            No, Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setStep("confirm");
      }}
      className="mt-3 flex flex-col gap-3 border border-line bg-paper-dim p-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.08em] text-ink-soft">Reason for cancelling</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        >
          {CANCEL_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.08em] text-ink-soft">Additional details (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Continue
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
