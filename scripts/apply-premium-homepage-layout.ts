/**
 * Applies the new curated, conversion-focused homepage structure: a lean
 * ordered set of visible sections, with every other legacy section (the
 * repeated per-category product blocks, extra banners/running strips, style
 * finder, flash sale, etc.) hidden — not deleted, so an admin can re-enable
 * any of them from /admin/homepage at any time.
 *
 * Safe to re-run: recomputes from scratch each time. Upserts rather than
 * deletes, so no HomepageSection row or its saved `config` is ever lost.
 *
 * Usage: npx tsx scripts/apply-premium-homepage-layout.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const VISIBLE_ORDER = [
  "hero",
  "categoryShowcase",
  "newArrivals",
  "promoBanner",
  "featuredCollections",
  "bestSellers",
  "adBanner",
  "trustFeatures",
  "newsletter",
];

const HIDDEN_KEYS = [
  "categoryGrid", // dead code, never rendered
  "shopByCategoryRail",
  "genderTriptych",
  "imageRunningBanner",
  "trending",
  "mensFeature",
  "womensFeature",
  "kidsFeature",
  "perfumeFeature",
  "jewelleryFeature",
  "runningBanner",
  "adBanner2",
  "brandStripTop",
  "brandStripBottom",
  "recommendedProducts",
  "styleFinder",
  "flashSale",
  // Its default images (/images/banners/social-*.jpg) don't exist in
  // /public — showing it as-is would be exactly the "empty placeholder"
  // gallery the spec says to avoid. Re-enable once real photos are
  // uploaded via the section's "Edit content" panel in /admin/homepage.
  "socialGallery",
];

async function main() {
  const rows = await db.homepageSection.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  await Promise.all(
    VISIBLE_ORDER.map((key, index) => {
      const existing = byKey.get(key);
      return db.homepageSection.upsert({
        where: { key },
        create: { key, isVisible: true, sortOrder: index, title: existing?.title ?? null, config: (existing?.config ?? null) as never },
        update: { isVisible: true, sortOrder: index },
      });
    })
  );

  await Promise.all(
    HIDDEN_KEYS.filter((key) => byKey.has(key)).map((key) =>
      db.homepageSection.update({ where: { key }, data: { isVisible: false } })
    )
  );

  const final = await db.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
  console.log("Homepage sections after update:");
  final.forEach((s) => console.log(`${s.sortOrder}: ${s.key} visible=${s.isVisible}`));

  // Leftover pre-rebrand brand name, if this database still has it — fix in
  // place rather than overwrite any other admin-customized setting values.
  const brandNameRow = await db.setting.findUnique({ where: { key: "brandName" } });
  if (brandNameRow && typeof brandNameRow.value === "string" && /maison\s*luxe/i.test(brandNameRow.value)) {
    await db.setting.update({ where: { key: "brandName" }, data: { value: "MIZOON ZARF" } });
    console.log('Fixed stale brandName setting: "Maison Luxe" -> "MIZOON ZARF"');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
