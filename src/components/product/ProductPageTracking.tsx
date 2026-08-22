"use client";

import { useEffect } from "react";

export interface RecentlyViewedEntry {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

const KEY = "recently_viewed";

export function pushRecentlyViewed(entry: RecentlyViewedEntry) {
  try {
    const existing: RecentlyViewedEntry[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const next = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — recently viewed simply won't persist
  }
}

export function readRecentlyViewed(excludeId?: string): RecentlyViewedEntry[] {
  try {
    const existing: RecentlyViewedEntry[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return existing.filter((e) => e.id !== excludeId);
  } catch {
    return [];
  }
}

export function ProductPageTracking({ productId, entry }: { productId: string; entry: RecentlyViewedEntry }) {
  useEffect(() => {
    fetch("/api/products/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch(() => null);
    pushRecentlyViewed(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
