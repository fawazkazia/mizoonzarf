"use client";

import { create } from "zustand";
import { toast } from "sonner";

export interface CartLine {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  size: string | null;
  color: string | null;
  price: number;
  salePrice: number | null;
  quantity: number;
  stock: number;
  image: string | null;
}

export interface CartState {
  id: string | null;
  lines: CartLine[];
  couponCode: string | null;
  couponError?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  freeShippingApplied: boolean;
  loading: boolean;
  drawerOpen: boolean;
  hasFetched: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number, openDrawerOnSuccess?: boolean) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

const emptyTotals = {
  id: null,
  lines: [],
  couponCode: null,
  couponError: undefined,
  subtotal: 0,
  discountAmount: 0,
  shippingFee: 0,
  taxAmount: 0,
  total: 0,
  freeShippingApplied: false,
};

export const useCartStore = create<CartState>((set, get) => ({
  ...emptyTotals,
  loading: false,
  drawerOpen: false,
  hasFetched: false,

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  fetchCart: async () => {
    const res = await fetch("/api/cart");
    const data = await res.json();
    set({ ...data, hasFetched: true });
  },

  addItem: async (variantId, quantity = 1, openDrawerOnSuccess = true) => {
    set({ loading: true });
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    const data = await res.json();
    set({ loading: false });
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't add this item to your cart.");
      return false;
    }
    set({ ...data, hasFetched: true });
    toast.success("Added to your bag.");
    if (openDrawerOnSuccess) get().openDrawer();
    return true;
  },

  updateItem: async (itemId, quantity) => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't update your bag.");
      return;
    }
    set({ ...data, hasFetched: true });
  },

  removeItem: async (itemId) => {
    const removedLine = get().lines.find((l) => l.id === itemId);
    const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      set({ ...data, hasFetched: true });
      toast("Item removed from your bag.", {
        action: removedLine
          ? { label: "Undo", onClick: () => get().addItem(removedLine.variantId, removedLine.quantity, false) }
          : undefined,
      });
    }
  },

  applyCoupon: async (code) => {
    const res = await fetch("/api/cart/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "That coupon isn't valid.");
      return;
    }
    set({ ...data, hasFetched: true });
    toast.success("Coupon applied.");
  },

  removeCoupon: async () => {
    const res = await fetch("/api/cart/coupon", { method: "DELETE" });
    const data = await res.json();
    if (res.ok) set({ ...data, hasFetched: true });
  },
}));

export function cartItemCount(state: Pick<CartState, "lines">): number {
  return state.lines.reduce((sum, l) => sum + l.quantity, 0);
}
