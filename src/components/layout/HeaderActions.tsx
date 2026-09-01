"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Search, Heart, User, ShoppingBag, Package, ChevronDown, Truck } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { CartPopover } from "@/components/cart/CartPopover";
import { useCartStore, cartItemCount } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useUIStore } from "@/stores/ui-store";
import { useClickOutside } from "@/hooks/useClickOutside";
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
      title={label}
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

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        title="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative inline-flex h-11 items-center gap-0.5 px-1 text-ink transition-colors duration-[var(--dur-1)] hover:text-ink-mute"
      >
        <User size={19} strokeWidth={1.5} />
        <ChevronDown size={13} strokeWidth={1.75} className={cn("transition-transform duration-[var(--dur-1)]", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[var(--z-panel)] mt-2 w-48 border border-line bg-paper-raise py-1.5 shadow-[var(--shadow-panel)]"
        >
          <Link href="/account/profile" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper-dim">
            My Profile
          </Link>
          <Link href="/account/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-paper-dim">
            <Package size={14} /> Track My Orders
          </Link>
          <Link href="/track-order" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-paper-dim">
            <Truck size={14} /> Track Your Order
          </Link>
          <Link href="/account/wishlist" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper-dim">
            Wishlist
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full px-4 py-2.5 text-left text-sm text-sale hover:bg-paper-dim"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function GuestAccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        title="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative inline-flex h-11 items-center gap-0.5 px-1 text-ink transition-colors duration-[var(--dur-1)] hover:text-ink-mute"
      >
        <User size={19} strokeWidth={1.5} />
        <ChevronDown size={13} strokeWidth={1.75} className={cn("transition-transform duration-[var(--dur-1)]", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[var(--z-panel)] mt-2 w-48 border border-line bg-paper-raise py-1.5 shadow-[var(--shadow-panel)]"
        >
          <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper-dim">
            Sign In
          </Link>
          <Link href="/register" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper-dim">
            Create Account
          </Link>
          <Link href="/track-order" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-paper-dim">
            <Truck size={14} /> Track Your Order
          </Link>
        </div>
      )}
    </div>
  );
}

export function HeaderActions({ isSignedIn }: { isSignedIn: boolean }) {
  const cart = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.productIds.size);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const count = cartItemCount(cart);

  const [cartPopoverOpen, setCartPopoverOpen] = useState(false);
  const cartWrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(cartWrapperRef, () => setCartPopoverOpen(false), cartPopoverOpen);

  return (
    <div className="flex items-center">
      <IconButton label="Search" onClick={() => setSearchOpen(true)} className="lg:hidden">
        <Search size={19} strokeWidth={1.5} />
      </IconButton>
      <LinkIcon href="/account/wishlist" label="Wishlist" badge={wishlistCount} className="hidden sm:inline-flex">
        <Heart size={19} strokeWidth={1.5} />
      </LinkIcon>
      {isSignedIn ? <AccountMenu /> : <GuestAccountMenu />}
      <div ref={cartWrapperRef} className="relative">
        <IconButton
          label="Bag"
          onClick={() => setCartPopoverOpen((v) => !v)}
          badge={count}
          aria-expanded={cartPopoverOpen}
        >
          <ShoppingBag size={19} strokeWidth={1.5} />
        </IconButton>
        {cartPopoverOpen && <CartPopover onClose={() => setCartPopoverOpen(false)} />}
      </div>
    </div>
  );
}
