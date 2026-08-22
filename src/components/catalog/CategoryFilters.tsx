"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SlidersHorizontal, X, LayoutGrid, Grid3x3, Star } from "lucide-react";
import type { CatalogFacets } from "@/lib/data/catalog";
import { useSettings } from "@/components/SettingsContext";
import { useFilterDrawerStore } from "@/stores/filter-drawer-store";
import { useGridDensityStore } from "@/stores/grid-density-store";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";

const RATING_OPTIONS = [4, 3, 2];
const DISCOUNT_OPTIONS = [20, 30, 50];

const SORTS: { value: string; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "rating", label: "Highest Rated" },
];

function toggleParam(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

function useActiveFilterCount() {
  const searchParams = useSearchParams();
  return (
    searchParams.getAll("size").length +
    searchParams.getAll("color").length +
    searchParams.getAll("brand").length +
    (searchParams.get("minPrice") ? 1 : 0) +
    (searchParams.get("maxPrice") ? 1 : 0) +
    (searchParams.get("category") ? 1 : 0) +
    (searchParams.get("rating") ? 1 : 0) +
    (searchParams.get("inStock") ? 1 : 0) +
    (searchParams.get("onSale") ? 1 : 0) +
    (searchParams.get("discount") ? 1 : 0)
  );
}

function GridDensityToggle() {
  const density = useGridDensityStore((s) => s.density);
  const setDensity = useGridDensityStore((s) => s.setDensity);

  useEffect(() => {
    useGridDensityStore.persist.rehydrate();
  }, []);

  return (
    <div className="hidden items-center gap-1 border-l border-line pl-4 sm:flex">
      <button
        aria-label="Comfortable grid"
        aria-pressed={density === "comfortable"}
        onClick={() => setDensity("comfortable")}
        className={cn("flex h-8 w-8 items-center justify-center", density === "comfortable" ? "text-ink" : "text-ink-soft/50")}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        aria-label="Compact grid"
        aria-pressed={density === "compact"}
        onClick={() => setDensity("compact")}
        className={cn("flex h-8 w-8 items-center justify-center", density === "compact" ? "text-ink" : "text-ink-soft/50")}
      >
        <Grid3x3 size={16} />
      </button>
    </div>
  );
}

export function CatalogToolbar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setOpen = useFilterDrawerStore((s) => s.setOpen);
  const sort = searchParams.get("sort") ?? "recommended";
  const activeCount = useActiveFilterCount();

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <p className="text-sm text-ink-soft">{total} products</p>
      <div className="flex items-center gap-4">
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] lg:hidden">
          <SlidersHorizontal size={14} /> Filters {activeCount > 0 && `(${activeCount})`}
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-line bg-paper px-3 py-2 text-xs uppercase tracking-[0.08em]"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <GridDensityToggle />
      </div>
    </div>
  );
}

export function CatalogSidebar({
  facets,
  subCategories,
}: {
  facets: CatalogFacets;
  subCategories: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const settings = useSettings();
  const { open, setOpen } = useFilterDrawerStore();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  const sizes = searchParams.getAll("size");
  const colors = searchParams.getAll("color");
  const brands = searchParams.getAll("brand");
  const activeCategory = searchParams.get("category");
  const activeRating = searchParams.get("rating");
  const activeDiscount = searchParams.get("discount");
  const inStockOnly = searchParams.get("inStock") === "1";
  const onSaleOnly = searchParams.get("onSale") === "1";
  const activeCount = useActiveFilterCount();

  function toggleBoolean(key: string, active: boolean) {
    updateParams((params) => {
      if (active) params.delete(key);
      else params.set(key, "1");
    });
  }

  function setRating(value: number) {
    updateParams((params) => {
      if (activeRating === String(value)) params.delete("rating");
      else params.set("rating", String(value));
    });
  }

  function setDiscount(value: number) {
    updateParams((params) => {
      if (activeDiscount === String(value)) params.delete("discount");
      else params.set("discount", String(value));
    });
  }

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function setMulti(key: string, values: string[]) {
    updateParams((params) => {
      params.delete(key);
      values.forEach((v) => params.append(key, v));
    });
  }

  function applyPrice() {
    updateParams((params) => {
      if (minPrice) params.set("minPrice", minPrice);
      else params.delete("minPrice");
      if (maxPrice) params.set("maxPrice", maxPrice);
      else params.delete("maxPrice");
    });
  }

  const content = (
    <div className="flex flex-col gap-8">
      {subCategories.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-ink-soft">Category</p>
          <div className="flex flex-col gap-2">
            {subCategories.map((c) => (
              <button
                key={c.slug}
                onClick={() => updateParams((p) => (activeCategory === c.slug ? p.delete("category") : p.set("category", c.slug)))}
                className={`text-left text-sm ${activeCategory === c.slug ? "font-semibold text-ink" : "text-ink-soft"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.sizes.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-ink-soft">Size</p>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const count = facets.sizeCounts[size] ?? 0;
              const active = sizes.includes(size);
              const disabled = count === 0 && !active;
              return (
                <button
                  key={size}
                  disabled={disabled}
                  onClick={() => setMulti("size", toggleParam(sizes, size))}
                  className={cn(
                    "border px-3 py-1.5 text-xs",
                    active ? "border-ink bg-ink text-paper" : "border-line",
                    disabled && "cursor-not-allowed text-ink-soft/30 line-through"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {facets.colors.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-ink-soft">Colour</p>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => {
              const count = facets.colorCounts[color.name] ?? 0;
              const active = colors.includes(color.name);
              const disabled = count === 0 && !active;
              return (
                <button
                  key={color.name}
                  disabled={disabled}
                  onClick={() => setMulti("color", toggleParam(colors, color.name))}
                  className={cn(
                    "flex items-center gap-1.5 border px-3 py-1.5 text-xs capitalize",
                    active ? "border-ink bg-ink text-paper" : "border-line",
                    disabled && "cursor-not-allowed text-ink-soft/30"
                  )}
                >
                  {color.hex && (
                    <span
                      className={cn("h-3 w-3 rounded-full ring-1 ring-ink/20", disabled && "opacity-30")}
                      style={{ backgroundColor: color.hex }}
                      aria-hidden="true"
                    />
                  )}
                  {color.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {facets.brands.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-ink-soft">Brand</p>
          <div className="flex flex-col gap-2">
            {facets.brands.map((brand) => {
              const count = facets.brandCounts[brand] ?? 0;
              const active = brands.includes(brand);
              const disabled = count === 0 && !active;
              return (
                <label key={brand} className={cn("flex items-center gap-2 text-sm", disabled && "text-ink-soft/40")}>
                  <input
                    type="checkbox"
                    checked={active}
                    disabled={disabled}
                    onChange={() => setMulti("brand", toggleParam(brands, brand))}
                  />
                  {brand} {count > 0 && <span className="text-ink-soft/50">({count})</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.12em] text-ink-soft">Rating</p>
        <div className="flex flex-col gap-2">
          {RATING_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={`flex items-center gap-1.5 text-left text-sm ${activeRating === String(r) ? "font-semibold text-ink" : "text-ink-soft"}`}
            >
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className={i < r ? "fill-gold text-gold" : "text-line"} />
                ))}
              </span>
              &amp; Up
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStockOnly} onChange={() => toggleBoolean("inStock", inStockOnly)} />
          In Stock Only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onSaleOnly} onChange={() => toggleBoolean("onSale", onSaleOnly)} />
          On Sale
        </label>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.12em] text-ink-soft">Discount</p>
        <div className="flex flex-col gap-2">
          {DISCOUNT_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDiscount(d)}
              className={`text-left text-sm ${activeDiscount === String(d) ? "font-semibold text-ink" : "text-ink-soft"}`}
            >
              {d}% Off or More
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.12em] text-ink-soft">
          Price ({settings.currencySymbol} {facets.priceMin} – {facets.priceMax})
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full border border-line px-2 py-1.5 text-sm"
          />
          <span className="text-ink-soft">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full border border-line px-2 py-1.5 text-sm"
          />
        </div>
        <button onClick={applyPrice} className="mt-2 text-xs underline">
          Apply
        </button>
      </div>

      {activeCount > 0 && (
        <button onClick={() => router.push(pathname)} className="text-xs uppercase tracking-[0.1em] text-sale underline">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">{content}</div>

      <Sheet open={open} onClose={() => setOpen(false)} side="left" ariaLabel="Filters" panelClassName="max-w-xs overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-xl">Filters</span>
          <button onClick={() => setOpen(false)} aria-label="Close filters" className="flex h-9 w-9 items-center justify-center">
            <X size={20} />
          </button>
        </div>
        {content}
      </Sheet>
    </>
  );
}
