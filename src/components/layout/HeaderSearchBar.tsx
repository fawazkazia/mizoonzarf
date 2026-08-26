"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Search, X, Mic } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { Price } from "@/components/ui/Price";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import { useSearchBox } from "@/hooks/useSearchBox";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

function ResultPrice({ price, compareAt }: { price: number; compareAt: number | null }) {
  const display = useDisplayPrice(price, compareAt);
  return (
    <span className="mt-0.5 inline-flex items-center gap-1">
      {display.isConverted && <span className="text-ink-soft/60">≈</span>}
      <Price price={display.price} compareAt={display.compareAt} currency={display.symbol} size="sm" />
    </span>
  );
}

/** Real inline search input in the desktop header — click it and type right
 * there, with results dropping down anchored below, instead of jumping to a
 * separate full-screen overlay (that's still the right pattern on mobile,
 * see SearchOverlay.tsx, but not for a header bar with room to type in place). */
export function HeaderSearchBar({ categories = [] }: { categories?: NavItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function collapse() {
    setExpanded(false);
    inputRef.current?.blur();
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
  } = useSearchBox(expanded, collapse);

  useClickOutside(wrapperRef, collapse, expanded);

  const browsableCategories = categories.filter((c) => !c.isVirtual).slice(0, 6);
  const showDropdown = expanded;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-[var(--radius-pill)] border bg-paper-dim px-4 text-sm outline-none transition-colors duration-[var(--dur-1)]",
          expanded ? "border-ink" : "border-line hover:border-ink-mute"
        )}
      >
        <Search size={17} strokeWidth={1.5} className="shrink-0 text-ink-soft" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products"
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent text-ink outline-none placeholder:text-ink-soft"
          style={{ outline: "none" }}
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoiceSearch}
            aria-label={listening ? "Stop voice search" : "Search by voice"}
            aria-pressed={listening}
            className={cn("shrink-0 text-ink-soft hover:text-ink", listening && "animate-pulse text-sale")}
          >
            <Mic size={16} />
          </button>
        )}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="shrink-0 text-ink-soft hover:text-ink"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-[var(--z-panel)] mt-2 max-h-[70vh] overflow-y-auto border border-line bg-paper-raise p-5 shadow-[var(--shadow-lift)]">
          {query.length < 2 ? (
            <div className="flex flex-col gap-6">
              {recent.length > 0 && (
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
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
                          className={cn("w-full py-1.5 text-left text-sm hover:text-ink", highlightIndex === i ? "text-ink underline" : "text-ink-soft")}
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
                  <p className="mb-2.5 text-xs uppercase tracking-[0.14em] text-ink-soft">Popular Searches</p>
                  <ul className="flex flex-col">
                    {popular.map((term, i) => (
                      <li key={term}>
                        <button
                          onClick={() => goToSearch(term)}
                          className={cn(
                            "w-full py-1.5 text-left text-sm capitalize hover:text-ink",
                            highlightIndex === recent.length + i ? "text-ink underline" : "text-ink-soft"
                          )}
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recent.length === 0 && popular.length === 0 && browsableCategories.length === 0 && (
                <p className="text-sm text-ink-soft">Start typing to search products, brands, or categories.</p>
              )}
              {browsableCategories.length > 0 && (
                <div>
                  <p className="mb-2.5 text-xs uppercase tracking-[0.14em] text-ink-soft">Browse Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {browsableCategories.map((c) => (
                      <Link key={c.slug} href={c.href} onClick={collapse} className="border border-line px-3 py-1.5 text-xs hover:border-ink">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {products.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  onClick={() => {
                    saveRecent(query);
                    collapse();
                  }}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={cn("flex items-center gap-3 rounded-sm p-1.5", highlightIndex === i && "bg-paper-dim")}
                >
                  <div className="aspect-[3/4] w-11 shrink-0 overflow-hidden bg-paper-dim">
                    <Img src={p.image} alt={p.name} seedFallback={p.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <ResultPrice price={p.price} compareAt={p.compareAtPrice} />
                  </div>
                </Link>
              ))}
              {products.length === 0 && <p className="py-4 text-sm text-ink-soft">No products found for &ldquo;{query}&rdquo;.</p>}
              {products.length > 0 && (
                <button onClick={() => goToSearch(query)} className="link-reveal mt-2 self-start text-xs uppercase tracking-[0.12em]">
                  View all results for &ldquo;{query}&rdquo; →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
