"use client";

import { create } from "zustand";

interface QuickViewState {
  slug: string | null;
  open: (slug: string) => void;
  close: () => void;
}

/** Drives a single mounted QuickViewModal instance — product cards dispatch
 * a slug instead of each owning their own modal. */
export const useQuickViewStore = create<QuickViewState>((set) => ({
  slug: null,
  open: (slug) => set({ slug }),
  close: () => set({ slug: null }),
}));
