"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useDisplayCurrencyStore } from "@/stores/display-currency-store";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
    useDisplayCurrencyStore.persist.rehydrate();
  }, [fetchCart, fetchWishlist]);

  return (
    <>
      {children}
      <CartDrawer />
      <QuickViewModal />
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "var(--font-sans)" } }} />
    </>
  );
}
