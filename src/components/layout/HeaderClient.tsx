"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { useSettings } from "@/components/SettingsContext";
import { useScrolled } from "@/hooks/useScrolled";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { UtilityBar } from "./UtilityBar";
import { DesktopNav } from "./DesktopNav";
import { HeaderActions } from "./HeaderActions";
import { SearchOverlay } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";
import type { NavItem } from "@/lib/nav";

export function HeaderClient({ menu, isSignedIn }: { menu: NavItem[]; isSignedIn: boolean }) {
  const settings = useSettings();
  const { scrolled, sentinelRef } = useScrolled();
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  const freeShippingMessage = `Free shipping on orders over ${settings.currencySymbol} ${settings.shipping.freeShippingThreshold}`;

  return (
    <>
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />
      <header
        data-condensed={scrolled || undefined}
        className="sticky top-0 z-[var(--z-header)] border-b border-line bg-paper/95 data-[condensed]:shadow-[var(--shadow-sticky)] data-[condensed]:backdrop-blur"
      >
        <div
          className={cn(
            "overflow-hidden bg-ink text-paper/85 transition-[max-height,opacity] duration-[var(--dur-2)] ease-[var(--ease-out-soft)]",
            scrolled ? "max-h-0 opacity-0" : "max-h-[var(--header-bar-h)] opacity-100"
          )}
        >
          <UtilityBar
            promoMessages={settings.header.promoMessages}
            supportPhone={settings.header.supportPhone}
            countryLabel={settings.header.countryLabel}
            countryFlag={settings.header.countryFlag}
            freeShippingMessage={freeShippingMessage}
            showFreeShipping={settings.header.showFreeShipping}
          />
        </div>

        <Container
          className={cn(
            "relative flex items-center justify-between transition-[height] duration-[var(--dur-2)] ease-[var(--ease-out-soft)] lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:justify-normal",
            scrolled ? "h-[var(--header-main-h-condensed)]" : "h-[var(--header-main-h)]"
          )}
        >
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <Link
            href="/"
            className={cn(
              "absolute left-1/2 -translate-x-1/2 transition-transform duration-[var(--dur-2)] lg:static lg:left-auto lg:translate-x-0 lg:justify-self-start",
              scrolled && "lg:scale-[0.92]"
            )}
          >
            {settings.branding.logoUrl ? (
              <Img src={settings.branding.logoUrl} alt={settings.brandName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-xl uppercase leading-none tracking-[0.24em] sm:text-2xl">
                {settings.brandName}
              </span>
            )}
          </Link>

          <div className="hidden lg:flex lg:justify-self-center">
            <DesktopNav items={menu} />
          </div>

          <div className="lg:justify-self-end">
            <HeaderActions isSignedIn={isSignedIn} />
          </div>
        </Container>
      </header>

      <SearchOverlay categories={menu} />
      <MobileMenu menu={menu} isSignedIn={isSignedIn} />
    </>
  );
}
