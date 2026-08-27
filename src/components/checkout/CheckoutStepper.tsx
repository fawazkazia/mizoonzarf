import { ShoppingCart, MapPin, CreditCard, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStepId = "cart" | "address" | "payment" | "confirm";

const STEPS: { id: CheckoutStepId; label: string; icon: LucideIcon }[] = [
  { id: "cart", label: "Cart", icon: ShoppingCart },
  { id: "address", label: "Address", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "confirm", label: "Confirm", icon: Check },
];

/** Purely a progress indicator for the single-scroll checkout — not a page
 * router. Only the current step is emphasized; earlier/later steps share a
 * neutral style (each keeps its own fixed icon rather than a "done" check). */
export function CheckoutStepper({ current, gradient, accent }: { current: CheckoutStepId; gradient: string; accent: string }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="mb-5 sm:mb-7">
      {/* Mobile: icon above label */}
      <div className="flex items-center sm:hidden">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const active = i === currentIdx;
          return (
            <div key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <span
                  className={cn("flex h-8 w-8 items-center justify-center rounded-full border text-ink-mute", active && "border-transparent text-paper")}
                  style={active ? { backgroundImage: gradient } : undefined}
                >
                  <Icon size={15} strokeWidth={1.75} />
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-mute" style={active ? { color: accent } : undefined}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <span className="mx-1.5 h-px flex-1 bg-line" />}
            </div>
          );
        })}
      </div>

      {/* Desktop: icon + "N. Label" beside it, breadcrumb style */}
      <div className="hidden items-center justify-center sm:flex">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const active = i === currentIdx;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-ink-mute", active && "border-transparent text-paper")}
                  style={active ? { backgroundImage: gradient } : undefined}
                >
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className={cn("whitespace-nowrap text-sm", active ? "font-semibold" : "text-ink-mute")} style={active ? { color: accent } : undefined}>
                  {i + 1}. {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <span className="mx-4 h-px w-16 bg-line lg:w-24" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
