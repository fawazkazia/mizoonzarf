"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { homepageSectionConfigSchemas, isConfigurableSection } from "@/lib/validation/homepage-section-config";
import type { Prisma } from "@/generated/prisma/client";

const sectionInputSchema = z.array(
  z.object({
    key: z.string().min(1),
    isVisible: z.boolean(),
    sortOrder: z.number().int(),
    title: z.string().optional().nullable(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
  })
);

export type SectionInput = z.infer<typeof sectionInputSchema>;

/** Re-validates each section's config against its own schema before persisting
 * — the admin form already validates per-field, but config arrives here as
 * untyped client JSON, so it's never trusted blindly. Unknown/malformed
 * config for a key is dropped rather than stored, since a bad write would
 * otherwise silently break that section's storefront rendering. */
function normalizeConfig(key: string, config: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | undefined {
  if (!config || !isConfigurableSection(key)) return undefined;
  const schema = homepageSectionConfigSchemas[key];
  const parsed = schema.safeParse(config);
  return parsed.success ? (parsed.data as Prisma.InputJsonValue) : undefined;
}

export async function saveHomepageSections(raw: SectionInput) {
  await requireStaff();
  const sections = sectionInputSchema.parse(raw);

  await Promise.all(
    sections.map((s) => {
      const config = normalizeConfig(s.key, s.config);
      return db.homepageSection.upsert({
        where: { key: s.key },
        create: { key: s.key, isVisible: s.isVisible, sortOrder: s.sortOrder, title: s.title || null, config },
        update: { isVisible: s.isVisible, sortOrder: s.sortOrder, title: s.title || null, ...(config !== undefined ? { config } : {}) },
      });
    })
  );

  revalidatePath("/admin/homepage");
  revalidatePath("/");
}
