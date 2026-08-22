"use client";

import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

export function MegaMenu({ item, onClose }: { item: NavItem; onClose: () => void }) {
  return (
    <div
      className="animate-menu-in absolute inset-x-0 top-full z-[var(--z-mega)] border-t border-line bg-paper-raise shadow-[var(--shadow-panel)]"
      role="region"
      aria-label={`${item.name} menu`}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {item.quickLinks.length > 0 && (
          <div className="flex gap-6 border-b border-line py-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {item.quickLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose} className="link-reveal hover:text-ink">
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_22rem] gap-10 py-9">
          {item.columns.slice(0, 3).map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] uppercase tracking-[0.14em] text-ink-soft">{col.title}</p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn("link-reveal text-sm", link.tone === "sale" && "text-sale")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {item.feature && (
            <Link
              href={item.feature.href}
              onClick={onClose}
              className="img-zoom group relative block aspect-[4/5] overflow-hidden bg-paper-dim"
            >
              <Img src={item.feature.imageUrl} alt={item.feature.title} seedFallback={item.feature.seed} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
                {item.feature.eyebrow && (
                  <p className="text-[10px] uppercase tracking-[0.16em] text-gold-soft">{item.feature.eyebrow}</p>
                )}
                <p className="mt-1 font-display text-xl">{item.feature.title}</p>
                <span className="link-reveal mt-2 inline-block text-xs uppercase tracking-[0.12em]">Shop Now</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
