"use client";

import { create } from "zustand";
import { toast } from "sonner";

interface WishlistState {
  productIds: Set<string>;
  hasFetched: boolean;
  fetchWishlist: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: new Set(),
  hasFetched: false,

  fetchWishlist: async () => {
    const res = await fetch("/api/wishlist");
    if (!res.ok) return;
    const data = await res.json();
    set({ productIds: new Set(data.productIds), hasFetched: true });
  },

  isWishlisted: (productId) => get().productIds.has(productId),

  toggle: async (productId) => {
    const isIn = get().productIds.has(productId);
    const method = isIn ? "DELETE" : "POST";
    const url = isIn ? `/api/wishlist?productId=${productId}` : "/api/wishlist";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify({ productId }) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Please sign in to use your wishlist.");
      return;
    }
    const next = new Set(get().productIds);
    if (isIn) {
      next.delete(productId);
      toast("Removed from wishlist.");
    } else {
      next.add(productId);
      toast.success("Added to wishlist.");
    }
    set({ productIds: next, hasFetched: true });
  },
}));
