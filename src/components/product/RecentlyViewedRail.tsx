"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import { readRecentlyViewed, type RecentlyViewedEntry } from "./ProductPageTracking";

function RecentlyViewedCard({ item }: { item: RecentlyViewedEntry }) {
  const display = useDisplayPrice(item.price);
  return (
    <Link href={`/product/${item.slug}`} className="w-36 shrink-0 snap-start">
      <div className="img-zoom aspect-[4/5] overflow-hidden bg-paper-dim">
        <Img src={item.image} alt={item.name} seedFallback={item.id} />
      </div>
      <p className="mt-2 line-clamp-1 text-xs">{item.name}</p>
      <p className="text-xs text-ink-soft">
        {display.isConverted && "≈ "}
        {display.symbol} {display.price.toFixed(2)}
      </p>
    </Link>
  );
}

export function RecentlyViewedRail({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<RecentlyViewedEntry[]>([]);

  useEffect(() => {
    // Deferred a microtask (not a synchronous setState at the top of the
    // effect) — still resolves before paint, and crucially still runs after
    // hydration completes, so the server's empty-list markup (localStorage
    // isn't available during SSR) never mismatches the client's first render.
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setItems(readRecentlyViewed(excludeId));
    });
    return () => {
      cancelled = true;
    };
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="border-t border-line py-16">
      <Container>
        <h2 className="mb-8 font-display text-2xl">Recently Viewed</h2>
        <ScrollRail>
          {items.map((item) => (
            <RecentlyViewedCard key={item.id} item={item} />
          ))}
        </ScrollRail>
      </Container>
    </section>
  );
}
