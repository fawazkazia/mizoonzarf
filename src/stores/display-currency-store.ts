"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DisplayCurrencyState {
  /** null = show the store's real (base) currency. */
  code: string | null;
  setCode: (code: string | null) => void;
}

/**
 * Persisted per-viewer "show prices in..." preference — display-only, never
 * read by cart/checkout/orders. `skipHydration: true` avoids an SSR/client
 * mismatch; rehydrated once in AppProviders (many components read this
 * store, so centralizing the rehydrate call avoids depending on mount order
 * between them and CountrySwitcher, the one place it's written from).
 */
export const useDisplayCurrencyStore = create<DisplayCurrencyState>()(
  persist(
    (set) => ({
      code: null,
      setCode: (code) => set({ code }),
    }),
    { name: "pl-display-currency", skipHydration: true }
  )
);
