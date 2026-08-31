"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { receivePurchaseOrderLine } from "./receive-actions";

export function ReceiveLineRow({ poItemId, remaining }: { poItemId: string; remaining: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(String(remaining));
  const [loading, setLoading] = useState(false);

  async function handleReceive() {
    const quantity = Number(qty);
    if (!quantity || quantity <= 0) {
      toast.error("Enter a quantity greater than zero.");
      return;
    }
    setLoading(true);
    try {
      await receivePurchaseOrderLine(poItemId, quantity);
      toast.success("Stock received.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't receive stock.");
    } finally {
      setLoading(false);
    }
  }

  if (remaining <= 0) return <span className="text-xs text-ink-soft">Fully received</span>;

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        max={remaining}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-20"
      />
      <Button size="sm" disabled={loading} onClick={handleReceive}>
        Receive
      </Button>
    </div>
  );
}
