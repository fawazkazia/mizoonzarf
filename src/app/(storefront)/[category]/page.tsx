import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { queryProducts } from "@/lib/data/catalog";
import { getCategoryBySlug, getCategoryBanner } from "@/lib/data/categories";
import { getCatalogVerticalConfig } from "@/lib/catalog-verticals";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { CatalogToolbar, CatalogSidebar } from "@/components/catalog/CategoryFilters";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { ActiveFilterChips } from "@/components/catalog/ActiveFilterChips";
import { CategoryHero } from "@/components/catalog/CategoryHero";
import { SubCategoryStrip } from "@/components/catalog/SubCategoryStrip";

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type SearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function buildPageHref(sp: SearchParams, pageNum: number) {
  const params = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    if (!v || k === "page") return;
    toArray(v).forEach((val) => params.append(k, val));
  });
  params.set("page", String(pageNum));
  return `?${params.toString()}`;
}

function Pagination({ sp, page, totalPages }: { sp: SearchParams; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const keep = new Set<number>([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= totalPages) keep.add(p);
  const sorted = [...keep].sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) items.push("ellipsis");
    items.push(p);
    prev = p;
  }

  const linkClass = "flex h-9 w-9 items-center justify-center border border-line text-sm hover:border-ink";

  return (
    <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Link href={buildPageHref(sp, page - 1)} className={linkClass} aria-label="Previous page">
          ‹
        </Link>
      )}
      {items.map((it, i) =>
        it === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-ink-soft">
            …
          </span>
        ) : (
          <Link
            key={it}
            href={buildPageHref(sp, it)}
            className={`flex h-9 w-9 items-center justify-center border text-sm ${it === page ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
          >
            {it}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={buildPageHref(sp, page + 1)} className={linkClass} aria-label="Next page">
          ›
        </Link>
      )}
    </nav>
  );
}

async function CatalogResults({
  category,
  sp,
  subCategories,
}: {
  category: string;
  sp: SearchParams;
  subCategories: { name: string; slug: string }[];
}) {
  const result = await queryProducts({
    categorySlug: category === "sale" ? undefined : category,
    subCategorySlug: typeof sp.category === "string" ? sp.category : undefined,
    saleOnly: category === "sale",
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
  });

  return (
    <>
      <CatalogSidebar facets={result.facets} subCategories={subCategories} />

      <div>
        <CatalogToolbar total={result.total} />
        <ActiveFilterChips />

        {result.products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-ink-soft">
            <p>No products match these filters.</p>
          </div>
        ) : (
          <CatalogGrid>
            {result.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </CatalogGrid>
        )}

        <Pagination sp={sp} page={result.page} totalPages={result.totalPages} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  if (category === "sale") return { title: "Sale" };
  const record = await getCategoryBySlug(category);
  if (!record) return {};
  return { title: record.seoTitle ?? record.name, description: record.seoDescription ?? record.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const sp = await searchParams;

  const categoryRecord = category !== "sale" ? await getCategoryBySlug(category) : null;
  if (category !== "sale" && !categoryRecord) notFound();

  const categoryBanner = category !== "sale" ? await getCategoryBanner(category) : null;
  const verticalConfig = getCatalogVerticalConfig(category);
  const title = category === "sale" ? "Sale" : (categoryRecord?.name ?? category);
  const activeSubSlug = typeof sp.category === "string" ? sp.category : undefined;

  return (
    <div>
      {category !== "sale" && (
        <CategoryHero
          name={title}
          description={categoryRecord?.description ?? categoryRecord?.seoDescription}
          imageUrl={categoryBanner?.imageUrl ?? categoryRecord?.imageUrl ?? null}
          accent="ink"
        />
      )}

      {categoryRecord && categoryRecord.children.length > 0 && (
        <SubCategoryStrip
          baseHref={`/${category}`}
          items={categoryRecord.children.map((c) => ({ name: c.name, slug: c.slug, imageUrl: c.imageUrl }))}
          activeSlug={activeSubSlug}
          variant={verticalConfig.subNavStyle}
        />
      )}

      <Container className="grid gap-10 py-10 lg:grid-cols-[240px_1fr]">
        <Suspense fallback={<ProductGridSkeleton />}>
          <CatalogResults category={category} sp={sp} subCategories={categoryRecord?.children.map((c) => ({ name: c.name, slug: c.slug })) ?? []} />
        </Suspense>
      </Container>
    </div>
  );
}
