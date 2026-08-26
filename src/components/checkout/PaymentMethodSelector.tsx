"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { PaymentBrandRow, VisaMark, MastercardMark, AmexMark } from "./PaymentBrandIcons";

interface PaymentMethodOption {
  id: string;
  label: string;
  configured: boolean;
}

/** Decorative only — no live card fields. Real card entry happens on the
 * payment partner's hosted/tokenized page after "Place Order", so collecting
 * a raw card number here would either do nothing or mishandle PCI data. */
function CardPreview() {
  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="mx-auto flex aspect-[1.586/1] w-full max-w-[240px] flex-col justify-between bg-gradient-to-br from-ink to-ink-soft p-3.5 text-paper shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between">
          <div className="h-5 w-7 bg-gradient-to-br from-gold-soft to-gold" />
          <div className="flex items-center gap-1 opacity-95 [&_svg]:h-3">
            <VisaMark className="brightness-0 invert" />
            <MastercardMark />
            <AmexMark />
          </div>
        </div>
        <div>
          <p className="font-mono text-[13px] tracking-[0.2em]">•••• •••• •••• ••••</p>
          <div className="mt-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.1em] text-paper/70">
            <span>Card Holder</span>
            <span>••/••</span>
          </div>
        </div>
      </div>
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-soft">
        <ShieldCheck size={13} className="shrink-0 text-success" />
        You&apos;ll enter your card details on our secure payment partner&apos;s page after placing your order.
      </p>
    </div>
  );
}

function RazorpayNote() {
  return (
    <div className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[11px] text-ink-soft">
      <ShieldCheck size={13} className="mt-0.5 shrink-0 text-success" />
      <p>You&apos;ll choose UPI, cards, netbanking, or wallets inside a secure Razorpay window.</p>
    </div>
  );
}

export function PaymentMethodSelector({
  methods,
  value,
  onChange,
}: {
  methods: PaymentMethodOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = methods.find((m) => m.id === value);

  useClickOutside(rootRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative border border-line p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="shrink-0 whitespace-nowrap text-xs font-medium uppercase tracking-[0.1em]">Payment Method</span>
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
          <span className="min-w-0 truncate">{selected?.label ?? "Select a payment method"}</span>
          <ChevronDown size={15} className={cn("shrink-0 transition-transform duration-[var(--dur-1)]", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[var(--z-panel)] mt-2 max-h-[70vh] overflow-y-auto border border-line bg-paper-raise p-2.5 shadow-[var(--shadow-panel)]">
          <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-1.5">
            {methods.map((pm) => (
              <label
                key={pm.id}
                className={cn(
                  "flex items-center justify-between gap-3 border px-3 py-2.5 text-sm transition-colors duration-[var(--dur-1)]",
                  !pm.configured ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                  pm.configured && value === pm.id ? "border-ink bg-paper-dim" : "border-line",
                  pm.configured && value !== pm.id && "hover:border-line-strong"
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    disabled={!pm.configured}
                    checked={value === pm.id}
                    onChange={() => onChange(pm.id)}
                    className="accent-ink"
                  />
                  <PaymentBrandRow id={pm.id} />
                  <span className="truncate font-medium">{pm.label}</span>
                </span>
                {!pm.configured && <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-mute">Coming Soon</span>}
              </label>
            ))}
          </div>

          {selected?.configured && selected.id === "CARD" && <CardPreview />}
          {selected?.configured && selected.id === "RAZORPAY" && <RazorpayNote />}
        </div>
      )}
    </div>
  );
}
