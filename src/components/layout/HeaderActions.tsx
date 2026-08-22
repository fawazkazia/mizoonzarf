"use client";

import Link from "next/link";
import { Search, Heart, User, ShoppingBag } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useCartStore, cartItemCount } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function LinkIcon({
  href,
  label,
  badge,
  className,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center text-ink transition-colors duration-[var(--dur-1)] hover:text-ink-mute",
        className
      )}
    >
      {children}
      {typeof badge === "number" && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-[var(--radius-pill)] bg-ink px-1 text-[10px] font-medium leading-none text-paper"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function HeaderActions({ isSignedIn }: { isSignedIn: boolean }) {
  const cart = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.productIds.size);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const count = cartItemCount(cart);

  return (
    <div className="flex items-center">
      <IconButton label="Search" onClick={() => setSearchOpen(true)}>
        <Search size={19} strokeWidth={1.5} />
      </IconButton>
      <LinkIcon href="/account/wishlist" label="Wishlist" badge={wishlistCount} className="hidden sm:inline-flex">
        <Heart size={19} strokeWidth={1.5} />
      </LinkIcon>
      <LinkIcon href={isSignedIn ? "/account/profile" : "/login"} label="Account" className="hidden sm:inline-flex">
        <User size={19} strokeWidth={1.5} />
      </LinkIcon>
      <IconButton label="Bag" onClick={cart.openDrawer} badge={count}>
        <ShoppingBag size={19} strokeWidth={1.5} />
      </IconButton>
    </div>
  );
}
