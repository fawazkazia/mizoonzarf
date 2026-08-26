import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { queryProducts } from "@/lib/data/catalog";
import { parseNaturalLanguageQuery } from "@/lib/search/nl-query-parser";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { CatalogToolbar, CatalogSidebar } from "@/components/catalog/CategoryFilters";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { ActiveFilterChips } from "@/components/catalog/ActiveFilterChips";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const EXPLICIT_FILTER_KEYS = ["size", "color", "brand", "minPrice", "maxPrice", "rating", "discount", "newArrivals", "bestSellers", "category", "onSale", "inStock"];

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  // A fresh natural-language query (no filter params yet) gets understood
  // once, then redirected into real filter params — same source of truth as
  // manual sidebar filtering, so the chips/sidebar/"Clear all" stay in sync
  // with what the parser understood instead of a parallel, invisible filter.
  const hasExplicitFilters = EXPLICIT_FILTER_KEYS.some((k) => sp[k] !== undefined);
  if (q && !hasExplicitFilters) {
    const parsed = parseNaturalLanguageQuery(q);
    if (parsed.summary) {
      const params = new URLSearchParams();
      params.set("q", q);
      if (parsed.filters.categorySlug) params.set("category", parsed.filters.categorySlug);
      parsed.filters.colors?.forEach((c) => params.append("color", c));
      parsed.filters.sizes?.forEach((s) => params.append("size", s));
      if (parsed.filters.minPrice !== undefined) params.set("minPrice", String(parsed.filters.minPrice));
      if (parsed.filters.maxPrice !== undefined) params.set("maxPrice", String(parsed.filters.maxPrice));
      // Always set `tag` once parsing succeeds — even empty — so the query
      // below can tell "nothing was parsed, fall back to the literal phrase"
      // apart from "parsing replaced the phrase with these structured
      // filters" (an empty tag means no leftover text search is needed).
      params.set("tag", parsed.filters.searchTerm ?? "");
      redirect(`/search?${params.toString()}`);
    }
  }

  const result = q
    ? await queryProducts({
        searchTerm: typeof sp.tag === "string" ? sp.tag || undefined : q,
        categorySlug: typeof sp.category === "string" ? sp.category : undefined,
        onSale: sp.onSale === "1",
        inStockOnly: sp.inStock === "1",
        newArrivals: sp.newArrivals === "1",
        bestSellers: sp.bestSellers === "1",
        minDiscountPercent: sp.discount ? Number(sp.discount) : undefined,
        sizes: toArray(sp.size),
        colors: toArray(sp.color),
        brands: toArray(sp.brand),
        minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
        maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
        minRating: sp.rating ? Number(sp.rating) : undefined,
        sort: (typeof sp.sort === "string" ? sp.sort : undefined) as never,
        page: sp.page ? Number(sp.page) : 1,
      })
    : null;

  return (
    <div>
      <div className="border-b border-line bg-paper-dim py-10">
        <Container>
          <h1 className="font-display text-4xl">{q ? `Results for "${q}"` : "Search"}</h1>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[240px_1fr]">
        {result ? (
          <>
            <CatalogSidebar facets={result.facets} subCategories={[]} />
            <div>
              <CatalogToolbar total={result.total} />
              <ActiveFilterChips />
              {result.products.length === 0 ? (
                <p className="py-20 text-center text-ink-soft">No products found for &quot;{q}&quot;. Try a different search.</p>
              ) : (
                <CatalogGrid>
                  {result.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </CatalogGrid>
              )}
            </div>
          </>
        ) : (
          <p className="col-span-2 py-20 text-center text-ink-soft">Start typing in the search bar above to find products.</p>
        )}
      </Container>
    </div>
  );
}
