"use client";

import { useEffect } from "react";

export function useClickOutside<T extends HTMLElement>(ref: React.RefObject<T | null>, handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref, handler, active]);
}
