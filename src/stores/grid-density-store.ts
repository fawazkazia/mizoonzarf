"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GridDensity = "comfortable" | "compact";

interface GridDensityState {
  density: GridDensity;
  setDensity: (density: GridDensity) => void;
}

/**
 * Persisted per-viewer PLP grid density preference — deliberately not a URL
 * param, since it's a viewing preference rather than something that should
 * trigger a server round-trip or end up in a shared link.
 * `skipHydration: true` avoids an SSR/client mismatch; the consuming
 * component calls `useGridDensityStore.persist.rehydrate()` after mount.
 */
export const useGridDensityStore = create<GridDensityState>()(
  persist(
    (set) => ({
      density: "comfortable",
      setDensity: (density) => set({ density }),
    }),
    { name: "pl-grid-density", skipHydration: true }
  )
);
