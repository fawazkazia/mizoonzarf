/**
 * One-off, idempotent backfill for the reusable attribute-value library (see
 * src/lib/inventory/variant-attributes.ts callers and prisma/schema.prisma's
 * AttributeValueLibrary model). Seeds the library from two sources:
 *
 * 1. Every value already used on any product's ProductVariantAttribute rows — so the library
 *    starts populated with real, in-use data instead of empty.
 * 2. A baseline set of common values for the most frequent attribute names (Size, Colour, Shoe
 *    Size, Waist, Length/Inseam, Fit), merged in on top so the admin has a useful starting point
 *    even for values not yet used by any seeded product.
 *
 * Safe to re-run: merges are additive and deduped case-insensitively by value, matching
 * addAttributeLibraryValues' runtime merge logic.
 *
 * Usage: npx tsx scripts/backfill-attribute-library.ts
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

interface LibValue {
  value: string;
  hex?: string;
}

const BASELINE: { name: string; isColor: boolean; values: LibValue[] }[] = [
  { name: "Size", isColor: false, values: ["S", "M", "L", "XL", "XXL"].map((value) => ({ value })) },
  {
    name: "Colour",
    isColor: true,
    values: [
      { value: "Black", hex: "#1c1b19" },
      { value: "White", hex: "#f5f3ee" },
      { value: "Blue", hex: "#2c3648" },
      { value: "Red", hex: "#8c2b28" },
      { value: "Green", hex: "#42502f" },
    ],
  },
  { name: "Shoe Size", isColor: false, values: ["6", "7", "8", "9", "10", "11"].map((value) => ({ value })) },
  { name: "Waist", isColor: false, values: ["28", "30", "32", "34", "36", "38"].map((value) => ({ value })) },
  { name: "Length/Inseam", isColor: false, values: ["30", "32", "34"].map((value) => ({ value })) },
  { name: "Fit", isColor: false, values: ["Slim", "Regular", "Relaxed", "Oversized"].map((value) => ({ value })) },
];

function mergeValues(existing: LibValue[], additions: LibValue[]): LibValue[] {
  const seen = new Map(existing.map((v) => [v.value.toLowerCase(), v]));
  for (const v of additions) {
    const key = v.value.toLowerCase();
    if (!seen.has(key)) seen.set(key, v);
  }
  return [...seen.values()];
}

async function main() {
  const pools = new Map<string, { isColor: boolean; values: LibValue[] }>();

  // Source 1: every value already used on any product.
  const defs = await db.productVariantAttribute.findMany({ select: { name: true, isColor: true, values: true } });
  for (const def of defs) {
    const values = (def.values as unknown as LibValue[]) ?? [];
    const pool = pools.get(def.name) ?? { isColor: def.isColor, values: [] };
    pool.values = mergeValues(pool.values, values);
    pools.set(def.name, pool);
  }

  // Source 2: baseline example values, merged on top.
  for (const b of BASELINE) {
    const pool = pools.get(b.name) ?? { isColor: b.isColor, values: [] };
    pool.values = mergeValues(pool.values, b.values);
    pools.set(b.name, pool);
  }

  let count = 0;
  for (const [name, pool] of pools) {
    const existing = await db.attributeValueLibrary.findUnique({ where: { name } });
    const merged = mergeValues((existing?.values as unknown as LibValue[]) ?? [], pool.values);
    await db.attributeValueLibrary.upsert({
      where: { name },
      create: { name, isColor: pool.isColor, values: merged as unknown as Prisma.InputJsonValue },
      update: { values: merged as unknown as Prisma.InputJsonValue },
    });
    count++;
  }

  console.log(`Attribute library backfill complete: ${count} attribute name(s) populated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
