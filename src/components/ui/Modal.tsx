"use client";

import { cn } from "@/lib/utils";
import { useOverlay, useDelayedUnmount } from "@/hooks/useOverlay";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  ariaLabel: string;
}

/** Centered dialog shared by quick view, the gallery lightbox, and the size
 * guide — wraps the same useOverlay contract as Sheet, just centered instead
 * of side-anchored. */
export function Modal({ open, onClose, children, panelClassName, ariaLabel }: ModalProps) {
  const mounted = useDelayedUnmount(open, 240);
  const ref = useOverlay<HTMLDivElement>(open, onClose);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-[var(--dur-2)]",
          open ? "opacity-100" : "opacity-0"
        )}
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
          "relative z-[var(--z-panel)] max-h-[90dvh] w-full max-w-2xl overflow-auto bg-paper-raise shadow-[var(--shadow-panel)] transition-all duration-[var(--dur-2)] ease-[var(--ease-out-soft)]",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0",
          panelClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
