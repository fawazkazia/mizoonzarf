import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [categories, products, collections] = await Promise.all([
    db.category.findMany({ where: { parentId: null }, select: { slug: true } }),
    db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    db.collection.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/sale`, changeFrequency: "daily", priority: 0.8 },
    ...categories.map((c) => ({ url: `${base}/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...collections.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
