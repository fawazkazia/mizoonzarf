"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { Price } from "@/components/ui/Price";
import { Sheet } from "@/components/ui/Sheet";
import { useSettings } from "@/components/SettingsContext";
import { useUIStore } from "@/stores/ui-store";
import type { NavItem } from "@/lib/nav";

interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
}

const RECENT_KEY = "recent_searches";

export function SearchOverlay({ categories = [] }: { categories?: NavItem[] }) {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const router = useRouter();
  const settings = useSettings();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SuggestionProduct[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [recentVersion, setRecentVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read once per open (and after saveRecent/"Clear all" bump the version) —
  // gated on `open` so this never touches localStorage during SSR, and
  // computed during render rather than via an effect-driven setState.
  const recent = useMemo<string[]>(() => {
    if (!open) return [];
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recentVersion]);

  function close() {
    setOpen(false);
    setQuery("");
    setProducts([]);
  }

  // Gated on `open` — previously this fetched on every page load regardless
  // of whether the overlay was visible.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setProducts(data.products ?? []);
        setPopular(data.popular ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") throw err;
      }
    }, 200);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, open]);

  function saveRecent(term: string) {
    if (!term.trim()) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecentVersion((v) => v + 1);
    fetch("/api/search/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term }),
    });
  }

  function goToSearch(term: string) {
    saveRecent(term);
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

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
            onKeyDown={(e) => e.key === "Enter" && goToSearch(query)}
            placeholder="Search products, brands, categories..."
            className="flex-1 bg-transparent font-display text-2xl outline-none placeholder:text-ink-soft/40"
          />
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
                    <button
                      onClick={() => {
                        localStorage.removeItem(RECENT_KEY);
                        setRecentVersion((v) => v + 1);
                      }}
                      className="text-xs text-ink-soft underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="flex flex-col">
                    {recent.map((term) => (
                      <li key={term}>
                        <button onClick={() => goToSearch(term)} className="link-reveal py-1.5 text-sm">
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
                    {popular.map((term) => (
                      <li key={term}>
                        <button onClick={() => goToSearch(term)} className="link-reveal py-1.5 text-sm capitalize">
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
                  className="flex items-center gap-4 animate-fade-in"
                  style={{ animationDelay: `${i * 22}ms` }}
                >
                  <div className="img-zoom aspect-[3/4] w-16 shrink-0 overflow-hidden bg-paper-dim">
                    <Img src={p.image} alt={p.name} seedFallback={p.id} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <Price price={p.price} compareAt={p.compareAtPrice} currency={settings.currencySymbol} size="sm" className="mt-1" />
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
