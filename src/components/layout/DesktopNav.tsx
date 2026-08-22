"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { MegaMenu } from "./MegaMenu";

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleOpen(slug: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setActiveSlug(slug), 70);
  }

  function scheduleClose() {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setActiveSlug(null), 140);
  }

  function closeNow() {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveSlug(null);
  }

  const activeItem = items.find((i) => i.slug === activeSlug && (i.columns.length > 0 || i.feature));

  return (
    <div onPointerLeave={scheduleClose}>
      <nav className="flex items-center gap-8">
        {items.map((item) => {
          const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const hasMenu = item.columns.length > 0;
          return (
            <div
              key={item.slug}
              onPointerEnter={() => hasMenu && scheduleOpen(item.slug)}
              onFocus={() => hasMenu && setActiveSlug(item.slug)}
            >
              <Link
                href={item.href}
                data-active={isCurrent || undefined}
                className={cn(
                  "link-reveal text-[11px] font-medium uppercase tracking-[0.16em] data-[active]:text-ink",
                  item.tone === "sale" ? "text-sale" : "text-ink-soft"
                )}
                aria-expanded={hasMenu ? activeSlug === item.slug : undefined}
                aria-haspopup={hasMenu ? "true" : undefined}
                onKeyDown={(e) => {
                  if (hasMenu && (e.key === "ArrowDown" || e.key === " ")) {
                    e.preventDefault();
                    setActiveSlug(item.slug);
                  } else if (e.key === "Escape") {
                    closeNow();
                  }
                }}
              >
                {item.name}
              </Link>
            </div>
          );
        })}
      </nav>

      {activeItem && (
        <>
          <div
            className="fixed inset-0 z-[35] bg-ink/25 transition-opacity duration-[var(--dur-2)]"
            onClick={closeNow}
            aria-hidden="true"
          />
          <MegaMenu item={activeItem} onClose={closeNow} />
        </>
      )}
    </div>
  );
}
