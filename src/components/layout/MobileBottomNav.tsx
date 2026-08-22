"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search as SearchIcon, Heart, ShoppingBag } from "lucide-react";
import { useCartStore, cartItemCount } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const TAB_BASE =
  "relative flex min-h-11 flex-col items-center justify-center gap-1 border-t-2 border-transparent py-2 text-[10px] uppercase tracking-wide";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-[var(--radius-pill)] bg-ink text-[8px] text-paper"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.productIds.size);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const count = cartItemCount(cart);

  const homeActive = isActivePath(pathname, "/");
  const wishlistActive = isActivePath(pathname, "/account/wishlist");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[var(--z-bottom-nav)] grid h-[var(--bottom-nav-h)] grid-cols-5 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <Link href="/" className={cn(TAB_BASE, homeActive ? "border-ink text-ink" : "text-ink-soft/70")}>
        <Home size={19} strokeWidth={homeActive ? 2 : 1.5} />
        Home
      </Link>

      <button type="button" onClick={() => setMobileMenuOpen(true)} className={cn(TAB_BASE, "text-ink-soft/70")}>
        <LayoutGrid size={19} strokeWidth={1.5} />
        Shop
      </button>

      <button type="button" onClick={() => setSearchOpen(true)} className={cn(TAB_BASE, "text-ink-soft/70")}>
        <SearchIcon size={19} strokeWidth={1.5} />
        Search
      </button>

      <Link
        href="/account/wishlist"
        className={cn(TAB_BASE, wishlistActive ? "border-ink text-ink" : "text-ink-soft/70")}
      >
        <span className="relative">
          <Heart size={19} strokeWidth={wishlistActive ? 2 : 1.5} />
          <Badge count={wishlistCount} />
        </span>
        Wishlist
      </Link>

      <button type="button" onClick={cart.openDrawer} className={cn(TAB_BASE, "text-ink-soft/70")}>
        <span className="relative">
          <ShoppingBag size={19} strokeWidth={1.5} />
          <Badge count={count} />
        </span>
        Bag
      </button>
    </nav>
  );
}
