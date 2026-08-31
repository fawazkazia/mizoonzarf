"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { sendPurchaseOrder, approvePurchaseOrder, cancelPurchaseOrder, closePurchaseOrder } from "./actions";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";

export function POStatusActions({ id, status }: { id: string; status: PurchaseOrderStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: () => Promise<void>, successMessage: string) {
    setLoading(true);
    try {
      await action();
      toast.success(successMessage);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3">
      {status === "DRAFT" && (
        <Button disabled={loading} onClick={() => run(() => sendPurchaseOrder(id), "Purchase order sent.")}>
          Mark as Sent
        </Button>
      )}
      {status === "SENT" && (
        <Button disabled={loading} onClick={() => run(() => approvePurchaseOrder(id), "Purchase order approved.")}>
          Approve
        </Button>
      )}
      {status === "RECEIVED" && (
        <Button disabled={loading} onClick={() => run(() => closePurchaseOrder(id), "Purchase order closed.")}>
          Close
        </Button>
      )}
      {!["RECEIVED", "CLOSED", "CANCELLED"].includes(status) && (
        <Button
          variant="secondary"
          disabled={loading}
          onClick={() => {
            if (confirm("Cancel this purchase order?")) run(() => cancelPurchaseOrder(id), "Purchase order cancelled.");
          }}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
