import { cn } from "@/lib/utils";
import { Banknote } from "lucide-react";

/**
 * Small, brand-colored recreations of payment-network marks for the checkout
 * UI. These are stylized lockups (not the licensed official asset files) —
 * built from the network's public brand colors/wordmark shape since no
 * official asset kit is vendored in this repo.
 */

type MarkProps = { className?: string };

export function VisaMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 44 16" className={cn("h-3.5 w-auto", className)} role="img" aria-label="Visa">
      <text x="0" y="13" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight={700} fontSize="15" fill="#1A1F71" letterSpacing="-0.4">
        VISA
      </text>
    </svg>
  );
}

export function MastercardMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 38 24" className={cn("h-4 w-auto", className)} role="img" aria-label="Mastercard">
      <circle cx="15" cy="12" r="11" fill="#EB001B" />
      <circle cx="23" cy="12" r="11" fill="#F79E1B" />
      <path d="M19 3.6a11 11 0 0 1 0 16.8 11 11 0 0 1 0-16.8Z" fill="#FF5F00" />
    </svg>
  );
}

export function AmexMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 40 24" className={cn("h-4 w-auto", className)} role="img" aria-label="American Express">
      <rect width="40" height="24" fill="#2E77BC" />
      <text x="20" y="15" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize="7.5" fill="#fff" letterSpacing="0.4">
        AMEX
      </text>
    </svg>
  );
}

export function RupayMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 52 16" className={cn("h-3.5 w-auto", className)} role="img" aria-label="RuPay">
      <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight={700} fontStyle="italic" fontSize="13" fill="#0A5F38" letterSpacing="-0.3">
        Ru<tspan fill="#F58220">Pay</tspan>
      </text>
    </svg>
  );
}

export function UpiMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 34 16" className={cn("h-3.5 w-auto", className)} role="img" aria-label="UPI">
      <path d="M2 12 8 4M8 12 14 4" stroke="#097939" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M4 12 10 4M10 12 16 4" stroke="#ED752E" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
      <text x="18" y="13" fontFamily="Arial, sans-serif" fontWeight={700} fontSize="12" fill="#14130F" letterSpacing="-0.2">
        UPI
      </text>
    </svg>
  );
}

export function PaypalMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 62 16" className={cn("h-3.5 w-auto", className)} role="img" aria-label="PayPal">
      <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight={800} fontStyle="italic" fontSize="14">
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009CDE">Pal</tspan>
      </text>
    </svg>
  );
}

export function ApplePayMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 40 16" className={cn("h-3.5 w-auto", className)} role="img" aria-label="Apple Pay">
      <path d="M6.4 3.2c0 .95-.75 1.9-1.7 1.9-.1-.95.4-1.95 1.7-1.9Z" fill="#000" />
      <path
        d="M7.9 5.5c-.9-.05-1.7.5-2.15.5-.45 0-1.15-.48-1.9-.47C2.9 5.55 2.05 6 1.6 6.75c-.9 1.55-.24 3.85.65 5.1.45.6.98 1.3 1.68 1.28.65-.02.9-.42 1.7-.42s1 .42 1.7.4c.7-.02 1.15-.62 1.6-1.22.5-.68.7-1.35.7-1.38-.02 0-1.35-.52-1.36-2.05-.02-1.28 1.04-1.9 1.08-1.93-.58-.86-1.5-.96-1.9-.98Z"
        fill="#000"
      />
      <text x="14" y="12.5" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight={600} fontStyle="italic" fontSize="12.5" fill="#000">
        Pay
      </text>
    </svg>
  );
}

export function GooglePayMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 38 16" className={cn("h-3.5 w-auto", className)} role="img" aria-label="Google Pay">
      <path d="M8 8 L14 8 A6 6 0 0 1 8 14 Z" fill="#4285F4" />
      <path d="M8 8 L8 14 A6 6 0 0 1 2 8 Z" fill="#34A853" />
      <path d="M8 8 L2 8 A6 6 0 0 1 8 2 Z" fill="#FBBC05" />
      <path d="M8 8 L8 2 A6 6 0 0 1 14 8 Z" fill="#EA4335" />
      <text x="18" y="12.5" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight={500} fontSize="12" fill="#5F6368">
        Pay
      </text>
    </svg>
  );
}

function BnplMark({ label, bg, fg, className }: { label: string; bg: string; fg: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex h-4 items-center px-1.5 text-[9px] font-bold lowercase tracking-tight", className)}
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}

export function TabbyMark({ className }: MarkProps) {
  return <BnplMark label="tabby" bg="#5CE6C0" fg="#0B2B24" className={className} />;
}

export function TamaraMark({ className }: MarkProps) {
  return <BnplMark label="tamara" bg="#FF4747" fg="#fff" className={className} />;
}

export function CodMark({ className }: MarkProps) {
  return <Banknote className={cn("h-4 w-4 text-gold-deep", className)} strokeWidth={1.75} />;
}

/** Renders the recognizable brand mark(s) for a given payment method id. */
export function PaymentBrandRow({ id, className }: { id: string; className?: string }) {
  const marks: Record<string, React.ReactNode> = {
    COD: <CodMark />,
    CARD: (
      <>
        <VisaMark />
        <MastercardMark />
        <AmexMark />
      </>
    ),
    RAZORPAY: (
      <>
        <VisaMark />
        <MastercardMark />
        <RupayMark />
        <UpiMark />
      </>
    ),
    APPLE_PAY: <ApplePayMark />,
    GOOGLE_PAY: <GooglePayMark />,
    PAYPAL: <PaypalMark />,
    TABBY: <TabbyMark />,
    TAMARA: <TamaraMark />,
  };

  return <span className={cn("flex shrink-0 items-center gap-1.5", className)}>{marks[id] ?? null}</span>;
}
