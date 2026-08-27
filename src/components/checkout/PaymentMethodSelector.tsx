"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Landmark, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { UpiMark, VisaMark, MastercardMark, RupayMark, CodMark } from "./PaymentBrandIcons";

interface PaymentMethodOption {
  id: string;
  label: string;
  configured: boolean;
}

type RowKey = "UPI" | "CARD" | "NETBANKING" | "COD";

interface DisplayRow {
  key: RowKey;
  /** The actual payment method id submitted to the server — UPI, Card, and
   * Net Banking all resolve to the same hosted-checkout provider (Razorpay,
   * or Stripe if that's what's configured), which lets the shopper make the
   * final choice inside its own secure widget. */
  value: string;
  label: string;
  subtitle: string;
  configured: boolean;
}

function buildRows(methods: PaymentMethodOption[]): DisplayRow[] {
  const razorpay = methods.find((m) => m.id === "RAZORPAY");
  const stripeCard = methods.find((m) => m.id === "CARD");
  const cod = methods.find((m) => m.id === "COD");
  const razorpayConfigured = razorpay?.configured ?? false;
  const cardValue = razorpayConfigured ? "RAZORPAY" : "CARD";
  const cardConfigured = razorpayConfigured || (stripeCard?.configured ?? false);

  return [
    { key: "UPI", value: "RAZORPAY", label: "UPI", subtitle: "Pay using any UPI app", configured: razorpayConfigured },
    { key: "CARD", value: cardValue, label: "Credit / Debit Card", subtitle: "Visa, Mastercard, RuPay & more", configured: cardConfigured },
    { key: "NETBANKING", value: "RAZORPAY", label: "Net Banking", subtitle: "Pay using your bank account", configured: razorpayConfigured },
    { key: "COD", value: "COD", label: "Cash on Delivery", subtitle: "Pay when you receive your order", configured: cod?.configured ?? false },
  ];
}

const ICON_TILE: Record<RowKey, React.ReactNode> = {
  UPI: <UpiMark className="h-4" />,
  CARD: <CreditCard size={18} strokeWidth={1.6} className="text-ink-soft" />,
  NETBANKING: <Landmark size={18} strokeWidth={1.6} className="text-ink-soft" />,
  COD: <CodMark />,
};

function RadioDot({ active, accent }: { active: boolean; accent: string }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-[var(--dur-1)]"
      style={{ borderColor: active ? accent : "var(--color-line-strong)" }}
    >
      {active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />}
    </span>
  );
}

const fieldClass = "min-h-[44px] w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink";

/** Decorative only — no live card fields. Real card entry happens on the
 * payment partner's hosted/tokenized page after "Place Order", so collecting
 * a raw card number here would either do nothing or mishandle PCI data. */
function CardFields() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">Card Number</p>
        <div className="relative">
          <input type="text" inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456" className={cn(fieldClass, "pr-10")} />
          <CreditCard size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        </div>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">Name on Card</p>
        <input type="text" autoComplete="off" placeholder="John Doe" className={fieldClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">Expiry Date</p>
          <input type="text" autoComplete="off" placeholder="MM / YY" className={fieldClass} />
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">
            CVV
            <Info size={11} className="text-ink-mute" />
          </p>
          <input type="text" inputMode="numeric" autoComplete="off" placeholder="123" className={fieldClass} />
        </div>
      </div>
    </div>
  );
}

export function PaymentMethodSelector({
  methods,
  value,
  onChange,
  accent,
}: {
  methods: PaymentMethodOption[];
  value: string;
  onChange: (id: string) => void;
  accent: string;
}) {
  const rows = useMemo(() => buildRows(methods), [methods]);
  const [selectedKey, setSelectedKey] = useState<RowKey>(() => {
    const preferred = rows.find((r) => r.key === "CARD" && r.value === value && r.configured);
    return (preferred ?? rows.find((r) => r.value === value && r.configured) ?? rows[0]).key;
  });
  const [openKey, setOpenKey] = useState<RowKey | null>(selectedKey);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelect(row: DisplayRow) {
    onChange(row.value);
    setSelectedKey(row.key);
    setOpenKey((prev) => (prev === row.key ? null : row.key));
  }

  return (
    <div ref={containerRef} className="rounded-xl border border-line p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-[0.1em] sm:text-sm">Payment Method</p>
      <p className="mt-1 mb-3 text-xs text-ink-soft">Select a payment method</p>

      <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const active = selectedKey === row.key;
          const open = openKey === row.key && row.configured;
          return (
            <div
              key={row.key}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors duration-[var(--dur-1)]",
                !row.configured ? "border-line opacity-45" : active ? "shadow-sm" : "border-line"
              )}
              style={row.configured && active ? { borderColor: accent } : undefined}
            >
              <button
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!row.configured}
                onClick={() => handleSelect(row)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left disabled:cursor-not-allowed sm:px-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-dim">{ICON_TILE[row.key]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{row.label}</span>
                  {row.key === "CARD" && (
                    <span className="my-1 flex items-center gap-1.5">
                      <VisaMark />
                      <MastercardMark />
                      <RupayMark />
                    </span>
                  )}
                  <span className="block truncate text-xs text-ink-soft">{row.configured ? row.subtitle : "Coming soon"}</span>
                </span>
                {row.configured && <RadioDot active={active} accent={accent} />}
              </button>

              {open && row.key === "CARD" && (
                <div className="border-t border-line px-3.5 pb-4 pt-3.5 sm:px-4">
                  <CardFields />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
