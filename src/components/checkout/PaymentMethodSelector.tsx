"use client";

import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentBrandRow, VisaMark, MastercardMark, AmexMark } from "./PaymentBrandIcons";

interface PaymentMethodOption {
  id: string;
  label: string;
  configured: boolean;
}

/** Faint per-network brand tint behind each tile — ties the card back to its
 * logo colors without competing with them. Falls back to a neutral wash. */
const TILE_TINT: Record<string, string> = {
  COD: "#a9803f",
  RAZORPAY: "#0a5f38",
  CARD: "#1a1f71",
  PAYPAL: "#003087",
};

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
  const selected = methods.find((m) => m.id === value);

  return (
    <div className="border border-line p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em]">Payment Method</p>

      <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {methods.map((pm) => {
          const tint = TILE_TINT[pm.id];
          const active = value === pm.id;
          return (
            <button
              key={pm.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!pm.configured}
              onClick={() => onChange(pm.id)}
              style={pm.configured ? { backgroundColor: `${tint}0d` } : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border px-2 py-3.5 text-center text-xs transition-all duration-[var(--dur-1)]",
                !pm.configured ? "cursor-not-allowed border-line opacity-40" : "cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                active ? "border-ink shadow-[var(--shadow-lift)]" : pm.configured && "border-transparent"
              )}
            >
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-paper">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
              <PaymentBrandRow id={pm.id} className="max-w-full" />
              <span className="font-medium leading-tight">{pm.label}</span>
              {!pm.configured && <span className="text-[10px] uppercase tracking-wide text-ink-mute">Coming Soon</span>}
            </button>
          );
        })}
      </div>

      {selected?.configured && selected.id === "CARD" && <CardPreview />}
      {selected?.configured && selected.id === "RAZORPAY" && <RazorpayNote />}
    </div>
  );
}
