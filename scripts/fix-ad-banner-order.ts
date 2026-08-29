/**
 * One-off fix: `adBanner` and `adBanner2` shipped with no HomepageSection DB
 * rows, so they fell back to DEFAULT_SECTION_ORDER's index (19, 20) — which
 * doesn't line up with sites that already have a custom admin-saved order
 * for every other section, and ends up stacking both banners together right
 * before the footer. This repositions them next to their documented anchors
 * (styleFinder / womensFeature and kidsFeature) using the site's *current*
 * saved order, then renumbers sortOrder sequentially for every section so
 * the whole list stays gap-free.
 *
 * Safe to re-run: recomputes from scratch each time.
 *
 * Usage: npx tsx scripts/fix-ad-banner-order.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AD_BANNER_DEFAULTS } from "../src/lib/validation/homepage-section-config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const rows = await db.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });

  type Entry = { key: string; isVisible: boolean; title: string | null; config: unknown };
  const byKey = new Map(rows.map((r) => [r.key, { key: r.key, isVisible: r.isVisible, title: r.title, config: r.config }]));

  const order: string[] = rows.map((r) => r.key).filter((k) => k !== "adBanner" && k !== "adBanner2");

  function insertAfter(anchorKey: string, newKey: string) {
    const idx = order.indexOf(anchorKey);
    if (idx === -1) {
      order.push(newKey);
      return;
    }
    order.splice(idx + 1, 0, newKey);
  }

  // adBanner: between Style Finder & Women's Collection — insert right
  // before styleFinder if present (i.e. right after whatever precedes it,
  // which is womensFeature in the site's saved order), else right after
  // womensFeature, else at the end.
  if (order.includes("styleFinder")) {
    order.splice(order.indexOf("styleFinder"), 0, "adBanner");
  } else if (order.includes("womensFeature")) {
    insertAfter("womensFeature", "adBanner");
  } else {
    order.push("adBanner");
  }

  // adBanner2: between Kids Collection & Style For Every Generation (socialGallery) —
  // insert right after kidsFeature, else right before socialGallery, else at the end.
  if (order.includes("kidsFeature")) {
    insertAfter("kidsFeature", "adBanner2");
  } else if (order.includes("socialGallery")) {
    order.splice(order.indexOf("socialGallery"), 0, "adBanner2");
  } else {
    order.push("adBanner2");
  }

  const entries: Entry[] = order.map((key) => {
    const existing = byKey.get(key);
    if (existing) return existing;
    const def = AD_BANNER_DEFAULTS[key];
    return { key, isVisible: true, title: null, config: def ?? null };
  });

  await Promise.all(
    entries.map((e, index) =>
      db.homepageSection.upsert({
        where: { key: e.key },
        create: { key: e.key, isVisible: e.isVisible, sortOrder: index, title: e.title, config: e.config as never },
        update: { sortOrder: index },
      })
    )
  );

  console.log("New order:");
  entries.forEach((e, i) => console.log(`${i}: ${e.key}`));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
