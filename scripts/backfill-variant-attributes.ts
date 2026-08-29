/**
 * One-off, idempotent backfill for the generic variant-attribute system (see
 * src/lib/inventory/variant-attributes.ts). For every product that has no
 * ProductVariantAttribute rows yet, derives "Size"/"Colour" attribute definitions from its
 * variants' existing size/color/colorHex columns and populates each variant's new
 * `attributeValues` JSON accordingly — so every existing product opens in the redesigned admin
 * UI already correctly populated, and every display site reading `variantAttrs()` keeps working.
 *
 * Safe to re-run: products that already have ProductVariantAttribute rows are skipped entirely.
 *
 * Usage: npx tsx scripts/backfill-variant-attributes.ts
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { VariantAttr } from "../src/lib/inventory/variant-attributes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { variantAttributes: true } },
      variants: { select: { id: true, size: true, color: true, colorHex: true } },
    },
  });

  let skipped = 0;
  let migrated = 0;

  for (const product of products) {
    if (product._count.variantAttributes > 0) {
      skipped++;
      continue;
    }

    const sizeValues: string[] = [];
    const colorValues: { value: string; hex?: string }[] = [];
    const seenSizes = new Set<string>();
    const seenColors = new Set<string>();

    for (const v of product.variants) {
      if (v.size && !seenSizes.has(v.size)) {
        seenSizes.add(v.size);
        sizeValues.push(v.size);
      }
      if (v.color && !seenColors.has(v.color)) {
        seenColors.add(v.color);
        colorValues.push({ value: v.color, hex: v.colorHex ?? undefined });
      }
    }

    if (sizeValues.length === 0 && colorValues.length === 0) {
      // No size/color data to migrate (e.g. a product with a single unattributed default variant).
      continue;
    }

    await db.$transaction(async (tx) => {
      let position = 0;
      if (sizeValues.length > 0) {
        await tx.productVariantAttribute.create({
          data: { productId: product.id, name: "Size", isColor: false, position: position++, values: sizeValues.map((value) => ({ value })) },
        });
      }
      if (colorValues.length > 0) {
        await tx.productVariantAttribute.create({
          data: { productId: product.id, name: "Colour", isColor: true, position: position++, values: colorValues },
        });
      }

      for (const v of product.variants) {
        const attrs: VariantAttr[] = [];
        if (v.size) attrs.push({ name: "Size", value: v.size });
        if (v.color) attrs.push({ name: "Colour", value: v.color, hex: v.colorHex ?? undefined });
        if (attrs.length === 0) continue;
        await tx.productVariant.update({ where: { id: v.id }, data: { attributeValues: attrs as unknown as Prisma.InputJsonValue } });
      }
    });

    migrated++;
  }

  console.log(`Backfill complete: ${migrated} product(s) migrated, ${skipped} already had attribute definitions (skipped).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
