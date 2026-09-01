"use client";

import { useState } from "react";
import { CancelOrderForm } from "./CancelOrderForm";

export function CancelOrderAction({ orderId, orderNumber, canCancel }: { orderId: string; orderNumber: string; canCancel: boolean }) {
  const [open, setOpen] = useState(false);

  if (!canCancel) return null;

  if (open) {
    return <CancelOrderForm orderId={orderId} orderNumber={orderNumber} onDone={() => setOpen(false)} />;
  }

  return (
    <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium uppercase tracking-[0.08em] text-sale underline underline-offset-2">
      Cancel Order
    </button>
  );
}
