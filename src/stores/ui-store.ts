"use client";

import { create } from "zustand";

interface UIState {
  searchOpen: boolean;
  mobileMenuOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

/** UI-only flags for overlays owned by HeaderClient but triggered from
 * elsewhere (e.g. the mobile bottom nav's Search tab, mounted as a sibling
 * in layout.tsx) — mirrors the existing filter-drawer-store pattern. */
export const useUIStore = create<UIState>((set) => ({
  searchOpen: false,
  mobileMenuOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
