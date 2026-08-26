"use client";

import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

function splitInHalf<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

export function MegaMenu({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const [brandsLeft, brandsRight] = splitInHalf(item.brands);

  return (
    <div
      className="animate-menu-in absolute left-1/2 top-full z-[var(--z-mega)] w-[56vw] max-w-[820px] min-w-[640px] -translate-x-1/2 border border-line bg-paper-raise shadow-[var(--shadow-panel)]"
      role="region"
      aria-label={`${item.name} menu`}
    >
      {item.quickLinks.length > 0 && (
        <div className="flex gap-5 border-b border-line px-6 py-2.5 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
          {item.quickLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={onClose} className="link-reveal hover:text-ink">
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[2fr_2fr_1.2fr] divide-x divide-line">
        <div className="px-6 py-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink">Shop by Category</p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            {item.columns.slice(0, 4).map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-ink-soft">{col.title}</p>
                <ul className="flex flex-col gap-2">
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
          </div>
        </div>

        {item.brands.length > 0 && (
          <div className="px-6 py-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink">Shop by Brand</p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2">
              {[brandsLeft, brandsRight].map((col, i) => (
                <ul key={i} className="flex flex-col gap-2">
                  {col.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={onClose} className="link-reveal text-sm">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        )}

        {item.feature && (
          <div className="flex flex-col p-4">
            <Link
              href={item.feature.href}
              onClick={onClose}
              className="img-zoom group relative block aspect-[4/5] overflow-hidden bg-paper-dim"
            >
              <Img src={item.feature.imageUrl} alt={item.feature.title} seedFallback={item.feature.seed} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
                {item.feature.eyebrow && (
                  <p className="text-[10px] uppercase tracking-[0.16em] text-gold-soft">{item.feature.eyebrow}</p>
                )}
                <p className="mt-1 font-display text-lg">{item.feature.title}</p>
              </div>
            </Link>
            <Link
              href={item.feature.href}
              onClick={onClose}
              className="mt-3 block border border-ink py-2.5 text-center text-xs uppercase tracking-[0.14em] transition-colors duration-[var(--dur-1)] hover:bg-ink hover:text-paper"
            >
              Shop Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
