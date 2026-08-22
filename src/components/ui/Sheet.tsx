"use client";

import { cn } from "@/lib/utils";
import { useOverlay, useDelayedUnmount } from "@/hooks/useOverlay";

type Side = "left" | "right" | "top";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  children: React.ReactNode;
  panelClassName?: string;
  ariaLabel: string;
}

const PANEL_BASE: Record<Side, string> = {
  left: "inset-y-0 left-0 h-full w-full max-w-sm shadow-[var(--shadow-drawer-left)]",
  right: "inset-y-0 right-0 h-full w-full max-w-sm shadow-[var(--shadow-drawer)]",
  top: "inset-x-0 top-0 max-h-[85dvh] shadow-[var(--shadow-panel)]",
};

const PANEL_TRANSFORM: Record<Side, (open: boolean) => string> = {
  left: (open) => (open ? "translate-x-0" : "-translate-x-full"),
  right: (open) => (open ? "translate-x-0" : "translate-x-full"),
  top: (open) => (open ? "translate-y-0" : "-translate-y-full"),
};

/** Side-anchored overlay panel shared by every drawer/sheet in the app
 * (cart, mobile nav, search) so they share one focus-trap/scroll-lock/escape
 * implementation instead of each hand-rolling `fixed inset-0 bg-ink/40`. */
export function Sheet({ open, onClose, side = "right", children, panelClassName, ariaLabel }: SheetProps) {
  const mounted = useDelayedUnmount(open, 320);
  const ref = useOverlay<HTMLDivElement>(open, onClose);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)]">
      <div
        className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-[var(--dur-2)]", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        inert={!open}
        className={cn(
          "absolute z-[var(--z-panel)] flex flex-col bg-paper-raise transition-transform duration-[var(--dur-3)] ease-[var(--ease-out-soft)]",
          PANEL_BASE[side],
          PANEL_TRANSFORM[side](open),
          panelClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
