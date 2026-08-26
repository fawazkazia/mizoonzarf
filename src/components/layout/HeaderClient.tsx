"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { useSettings } from "@/components/SettingsContext";
import { formatINR } from "@/lib/currency";
import { useScrolled } from "@/hooks/useScrolled";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { UtilityBar } from "./UtilityBar";
import { DesktopNav } from "./DesktopNav";
import { HeaderActions } from "./HeaderActions";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { SearchOverlay } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";
import type { NavItem } from "@/lib/nav";

export function HeaderClient({ menu, isSignedIn }: { menu: NavItem[]; isSignedIn: boolean }) {
  const settings = useSettings();
  const { scrolled, sentinelRef } = useScrolled();
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  const freeShippingMessage = `Free shipping on orders over ${formatINR(settings.shipping.freeShippingThreshold)}`;

  return (
    <>
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />
      <header
        data-condensed={scrolled || undefined}
        className="sticky top-0 z-[var(--z-header)] border-b border-line bg-paper/95 data-[condensed]:shadow-[var(--shadow-sticky)] data-[condensed]:backdrop-blur"
      >
        <div className="overflow-hidden bg-ink text-paper/85">
          <UtilityBar
            promoMessages={settings.header.promoMessages}
            supportPhone={settings.header.supportPhone}
            freeShippingMessage={freeShippingMessage}
            showFreeShipping={settings.header.showFreeShipping}
          />
        </div>

        <Container
          className={cn(
            "relative flex items-center justify-between gap-4 transition-[height] duration-[var(--dur-2)] ease-[var(--ease-out-soft)] lg:gap-8",
            scrolled ? "h-[var(--header-main-h-condensed)]" : "h-[var(--header-main-h)]"
          )}
        >
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <Link
            href="/"
            className={cn(
              "absolute left-1/2 shrink-0 -translate-x-1/2 transition-transform duration-[var(--dur-2)] lg:static lg:left-auto lg:translate-x-0",
              scrolled && "lg:scale-[0.92]"
            )}
          >
            <span className="flex items-center gap-2.5">
              {settings.branding.logoUrl && (
                <Img
                  src={settings.branding.logoUrl}
                  alt={settings.brandName}
                  priority
                  className="h-10 w-auto object-contain sm:h-11 lg:h-12"
                />
              )}
              <span className="font-display text-xl uppercase leading-none tracking-[0.24em] sm:text-2xl">
                {settings.brandName}
              </span>
            </span>
          </Link>

          <div className="hidden max-w-xl flex-1 lg:block">
            <HeaderSearchBar categories={menu} />
          </div>

          <HeaderActions isSignedIn={isSignedIn} />
        </Container>

        <div className="relative hidden border-t border-line lg:block">
          <Container className="relative flex items-center justify-center py-3">
            <DesktopNav items={menu} />
          </Container>
        </div>
      </header>

      <SearchOverlay categories={menu} />
      <MobileMenu menu={menu} isSignedIn={isSignedIn} />
    </>
  );
}
