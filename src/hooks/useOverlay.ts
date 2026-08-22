"use client";

import { useEffect, useRef, useState } from "react";

let lockCount = 0;
let previousOverflow = "";

function lockBodyScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount++;
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
  }
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared behaviour for every Sheet/Modal instance: Escape to close, a
 * ref-counted body scroll lock (so a drawer opened from inside another
 * overlay doesn't unlock the page early), a focus trap while open, and focus
 * restored to whatever triggered the overlay on close.
 */
export function useOverlay<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    lockBodyScroll();

    const container = ref.current;
    const initialFocusable = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initialFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unlockBodyScroll();
      previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return ref;
}

/** Keeps a closed overlay mounted for `ms` so its close transition can play. */
export function useDelayedUnmount(open: boolean, ms: number) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) return;
    const timeout = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(timeout);
  }, [open, ms]);

  // Derived rather than set synchronously on the `open` branch above: while
  // open is true the answer is always true regardless of latent `mounted`
  // state (covers re-opening before a pending close timeout fires too).
  return open || mounted;
}
