"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestReturn } from "@/app/(storefront)/account/returns/actions";
import { RETURN_REASONS } from "@/lib/validation/return";
import { Button } from "@/components/ui/Button";

export function RequestReturnForm({ orderItemId, onDone }: { orderItemId: string; onDone: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestReturn({ orderItemId, reason, description: description || undefined });
      toast.success("Return requested. We'll review it shortly.");
      onDone();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't request a return.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 border border-line bg-paper-dim p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.08em] text-ink-soft">Reason</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        >
          {RETURN_REASONS.map((r) => (
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
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Submitting..." : "Submit Return Request"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
