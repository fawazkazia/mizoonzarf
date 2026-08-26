"use client";

import { create } from "zustand";

interface HeroVisibilityState {
  heroInView: boolean;
  setHeroInView: (inView: boolean) => void;
}

/**
 * Tracks whether the homepage Hero section is on screen so the floating
 * WhatsApp/AI-assistant buttons can duck out of the way — on short mobile
 * viewports the Hero's bottom-anchored slide text sits in the same band as
 * those fixed-position buttons. Defaults to false so the buttons render
 * normally on every other page (nothing sets this store outside Hero.tsx).
 */
export const useHeroVisibilityStore = create<HeroVisibilityState>((set) => ({
  heroInView: false,
  setHeroInView: (heroInView) => set({ heroInView }),
}));
