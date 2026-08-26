"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendCartRecoveryEmail } from "./actions";

export function RecoveryButton({ cartId, disabled }: { cartId: string; disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (disabled) {
    return <span className="text-xs text-ink-soft/50">No contact info</span>;
  }

  async function handleClick() {
    setLoading(true);
    try {
      await sendCartRecoveryEmail(cartId);
      toast.success("Recovery email sent.");
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send recovery email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || sent}
      className="text-xs uppercase tracking-wide underline disabled:opacity-40"
    >
      {sent ? "Sent" : loading ? "Sending..." : "Send Recovery Email"}
    </button>
  );
}
