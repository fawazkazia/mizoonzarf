"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronDown, User, Heart, Search as SearchIcon, MessageCircle, Package } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { Sheet } from "@/components/ui/Sheet";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useUIStore } from "@/stores/ui-store";
import { useSettings } from "@/components/SettingsContext";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

export function MobileMenu({ menu, isSignedIn }: { menu: NavItem[]; isSignedIn: boolean }) {
  const open = useUIStore((s) => s.mobileMenuOpen);
  const setOpen = useUIStore((s) => s.setMobileMenuOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const settings = useSettings();
  const [expanded, setExpanded] = useState<string | null>(null);

  function close() {
    setOpen(false);
  }

  function openSearch() {
    setOpen(false);
    setSearchOpen(true);
  }

  return (
    <Sheet open={open} onClose={close} side="left" ariaLabel="Site navigation" panelClassName="w-[86vw] max-w-sm">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <span className="font-[family-name:var(--font-display)] text-xl font-normal">{settings.brandName}</span>
        <button onClick={close} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center">
          <X size={20} />
        </button>
      </div>

      <button
        onClick={openSearch}
        className="flex items-center gap-3 border-b border-line px-6 py-4 text-left text-sm text-ink-soft"
      >
        <SearchIcon size={17} /> Search products, brands, categories...
      </button>

      <nav className="flex-1 overflow-y-auto px-6 py-2">
        <ul className="flex flex-col divide-y divide-line">
          {menu.map((item) => {
            const isExpanded = expanded === item.slug;
            const hasChildren = item.columns.length > 0 && !item.isVirtual;

            return (
              <li key={item.slug}>
                <div className="flex items-center justify-between py-3.5">
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "text-sm font-medium uppercase tracking-[0.1em]",
                      item.tone === "sale" && "text-sale"
                    )}
                  >
                    {item.name}
                  </Link>
                  {hasChildren && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.slug)}
                      aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
                      aria-expanded={isExpanded}
                      className="flex h-11 w-11 items-center justify-center"
                    >
                      <ChevronDown
                        size={16}
                        className={cn("transition-transform duration-[var(--dur-1)]", isExpanded && "rotate-180")}
                      />
                    </button>
                  )}
                </div>

                {hasChildren && (
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-[var(--dur-2)] ease-[var(--ease-out-soft)]",
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-4 pb-4 pl-1">
                        {item.columns.map((col) => (
                          <div key={col.title}>
                            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-ink-soft">{col.title}</p>
                            <ul className="flex flex-col gap-1">
                              {col.links.map((link) => (
                                <li key={link.href}>
                                  <Link
                                    href={link.href}
                                    onClick={close}
                                    className={cn(
                                      "flex items-center gap-3 py-2 text-sm",
                                      link.tone === "sale" ? "text-sale" : "text-ink-soft"
                                    )}
                                  >
                                    {link.imageUrl !== undefined && (
                                      <span className="h-9 w-9 shrink-0 overflow-hidden bg-paper-dim">
                                        <Img src={link.imageUrl} alt="" seedFallback={link.href} />
                                      </span>
                                    )}
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-4 border-t border-line px-6 py-5">
        <div className="flex gap-6">
          <Link href={isSignedIn ? "/account/profile" : "/login"} onClick={close} className="flex items-center gap-2 text-sm">
            <User size={17} /> Account
          </Link>
          <Link href="/account/wishlist" onClick={close} className="flex items-center gap-2 text-sm">
            <Heart size={17} /> Wishlist
          </Link>
          <Link href={isSignedIn ? "/account/orders" : "/track-order"} onClick={close} className="flex items-center gap-2 text-sm">
            <Package size={17} /> Track Order
          </Link>
        </div>
        <a
          href={`https://wa.me/${settings.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-ink-soft"
        >
          <MessageCircle size={17} /> {settings.header.supportPhone}
        </a>
        <p className="flex items-center gap-1.5 text-xs text-ink-soft">
          <CountryFlag code={settings.header.countryCode} className="h-3 w-4 shrink-0 rounded-[1px]" /> {settings.header.countryLabel}
        </p>
      </div>
    </Sheet>
  );
}
