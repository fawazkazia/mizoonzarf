"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, Mic } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { Price } from "@/components/ui/Price";
import { Sheet } from "@/components/ui/Sheet";
import { useUIStore } from "@/stores/ui-store";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import { useSearchBox } from "@/hooks/useSearchBox";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

function ResultPrice({ price, compareAt }: { price: number; compareAt: number | null }) {
  const display = useDisplayPrice(price, compareAt);
  return (
    <span className="mt-1 inline-flex items-center gap-1">
      {display.isConverted && <span className="text-ink-soft/60">≈</span>}
      <Price price={display.price} compareAt={display.compareAt} currency={display.symbol} size="sm" />
    </span>
  );
}

/** Mobile's full-screen search (the desktop header search is now an inline
 * dropdown — see HeaderSearchBar.tsx — since a full takeover screen for what
 * should be "click and type right here" was the wrong pattern there, but it's
 * still the right one on mobile where there's no room for an anchored panel). */
export function SearchOverlay({ categories = [] }: { categories?: NavItem[] }) {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    reset();
  }

  const {
    query,
    setQuery,
    products,
    popular,
    recent,
    clearRecent,
    highlightIndex,
    setHighlightIndex,
    saveRecent,
    goToSearch,
    handleKeyDown,
    voiceSupported,
    listening,
    toggleVoiceSearch,
    reset,
  } = useSearchBox(open, close);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  const browsableCategories = categories.filter((c) => !c.isVirtual);

  return (
    <Sheet open={open} onClose={close} side="top" ariaLabel="Search" panelClassName="max-h-[85dvh] overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-10 pt-8">
        <div className="flex items-center gap-4 border-b border-ink pb-4">
          <SearchIcon size={20} className="text-ink-soft" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, brands, categories..."
            className="flex-1 bg-transparent font-display text-2xl outline-none placeholder:text-ink-soft/40"
          />
          {voiceSupported && (
            <button
              onClick={toggleVoiceSearch}
              aria-label={listening ? "Stop voice search" : "Search by voice"}
              aria-pressed={listening}
              className={cn("text-ink-soft hover:text-ink", listening && "animate-pulse text-sale")}
            >
              <Mic size={18} />
            </button>
          )}
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="text-ink-soft hover:text-ink">
              <X size={16} />
            </button>
          )}
          <button onClick={close} aria-label="Close search" className="flex h-11 w-11 items-center justify-center">
            <X size={22} />
          </button>
        </div>

        {query.length < 2 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-6">
              {recent.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Recent Searches</p>
                    <button onClick={clearRecent} className="text-xs text-ink-soft underline">
                      Clear all
                    </button>
                  </div>
                  <ul className="flex flex-col">
                    {recent.map((term, i) => (
                      <li key={term}>
                        <button
                          onClick={() => goToSearch(term)}
                          className={cn("link-reveal py-1.5 text-sm", highlightIndex === i && "text-ink underline")}
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {popular.length > 0 && (
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.14em] text-ink-soft">Popular Searches</p>
                  <ul className="flex flex-col">
                    {popular.map((term, i) => (
                      <li key={term}>
                        <button
                          onClick={() => goToSearch(term)}
                          className={cn(
                            "link-reveal py-1.5 text-sm capitalize",
                            highlightIndex === recent.length + i && "text-ink underline"
                          )}
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {browsableCategories.length > 0 && (
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.14em] text-ink-soft">Trending Categories</p>
                <div className="flex flex-wrap gap-2">
                  {browsableCategories.map((c) => (
                    <Link
                      key={c.slug}
                      href={c.href}
                      onClick={close}
                      className="border border-line px-3 py-1.5 text-sm hover:border-ink"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {products.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  onClick={() => saveRecent(query)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={cn(
                    "flex items-center gap-4 animate-fade-in rounded-sm",
                    highlightIndex === i && "bg-paper-dim"
                  )}
                  style={{ animationDelay: `${i * 22}ms` }}
                >
                  <div className="img-zoom aspect-[3/4] w-16 shrink-0 overflow-hidden bg-paper-dim">
                    <Img src={p.image} alt={p.name} seedFallback={p.id} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <ResultPrice price={p.price} compareAt={p.compareAtPrice} />
                  </div>
                </Link>
              ))}
            </div>
            {products.length === 0 && <p className="py-6 text-sm text-ink-soft">No products found for &ldquo;{query}&rdquo;.</p>}
            {products.length > 0 && (
              <button onClick={() => goToSearch(query)} className="link-reveal self-start text-xs uppercase tracking-[0.12em]">
                View all results for &ldquo;{query}&rdquo; →
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
