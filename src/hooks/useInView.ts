"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Callback = (inView: boolean) => void;

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new Map<Element, Callback>();

function getObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        callbacks.get(entry.target)?.(entry.isIntersecting);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  return sharedObserver;
}

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/** Subscribes to the OS reduced-motion preference via useSyncExternalStore
 * (the React-blessed way to read external browser state) rather than
 * useState+useEffect, so no synchronous setState-in-effect is needed. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

/**
 * One shared IntersectionObserver instance backs every useInView() call, so a
 * page with dozens of fade-in sections (homepage, PLP grids) doesn't spin up
 * dozens of observers.
 */
export function useInView<T extends HTMLElement>(options?: { once?: boolean }) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const once = options?.once ?? true;

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const observer = getObserver();

    callbacks.set(el, (visible) => {
      if (visible) {
        setInView(true);
        if (once) {
          observer.unobserve(el);
          callbacks.delete(el);
        }
      } else if (!once) {
        setInView(false);
      }
    });
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, [once, reducedMotion]);

  return { ref, inView: inView || reducedMotion };
}
