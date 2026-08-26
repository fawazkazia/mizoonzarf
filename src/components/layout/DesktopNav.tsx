"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    if (openTimer.current) clearTimeout(openTimer.current);
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

  /** Cancels a pending close the instant the pointer re-enters ANY part of
   * this subtree — critically including the mega panel itself, not just a
   * nav trigger. Without this, moving the cursor from a trigger down into
   * the panel below it crosses a small gap that isn't part of either
   * element, which fires the wrapper's pointerleave and starts the close
   * timer; nothing then cancelled it once the pointer landed on the panel,
   * so the menu could vanish out from under the user mid-move. */
  function cancelPendingClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function handleFocusOut(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeNow();
  }

  const activeItem = items.find((i) => i.slug === activeSlug && (i.columns.length > 0 || i.feature));

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") closeNow();
  }

  return (
    <div onPointerEnter={cancelPendingClose} onPointerLeave={scheduleClose} onBlur={handleFocusOut} onKeyDown={handleKeyDown}>
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
          {/* Portaled to <body>: `header` is `position: sticky` + z-index,
              which creates its own stacking context. Rendered as a normal
              descendant, this scrim's z-index would only be compared
              against header's OWN children — since the nav row has no
              explicit z-index, the scrim (being explicitly positioned)
              would paint ON TOP of the entire nav bar once open, silently
              eating hover/click on every other item until it was dismissed.
              Portaling escapes that context so it's correctly layered below
              the header (z-40) and above the page, as intended.

              onPointerEnter={closeNow} (not scheduleClose): React computes
              mouse enter/leave for portaled content against the REACT tree,
              not the rendered DOM tree — since this scrim is still a React
              child of the wrapper div below (just DOM-portaled elsewhere),
              moving the pointer onto it does NOT fire the wrapper's
              onPointerLeave the way moving onto any *unrelated* page element
              does. Without this, the menu never auto-closes when the cursor
              lands on the dimmed backdrop instead of a real nav/page element.
              Closing immediately (not debounced) is correct here: the scrim
              is only ever hit-testable where neither the header nor the
              panel occlude it, i.e. only once the cursor has genuinely left
              both. */}
          {typeof document !== "undefined" &&
            createPortal(
              <div
                className="fixed inset-0 z-[35] bg-ink/25 transition-opacity duration-[var(--dur-2)]"
                onClick={closeNow}
                onPointerEnter={closeNow}
                aria-hidden="true"
              />,
              document.body
            )}
          <MegaMenu item={activeItem} onClose={closeNow} />
        </>
      )}
    </div>
  );
}
