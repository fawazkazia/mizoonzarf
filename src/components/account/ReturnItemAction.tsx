"use client";

import { useState } from "react";
import { RequestReturnForm } from "./RequestReturnForm";

export function ReturnItemAction({ orderItemId, canReturn, alreadyRequested }: { orderItemId: string; canReturn: boolean; alreadyRequested: boolean }) {
  const [open, setOpen] = useState(false);

  if (alreadyRequested) {
    return <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-soft">Return requested</p>;
  }
  if (!canReturn) return null;

  if (open) {
    return <RequestReturnForm orderItemId={orderItemId} onDone={() => setOpen(false)} />;
  }

  return (
    <button type="button" onClick={() => setOpen(true)} className="mt-1 text-[11px] uppercase tracking-wide underline text-ink-soft hover:text-ink">
      Request Return
    </button>
  );
}
