"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";

const sectionInputSchema = z.array(
  z.object({
    key: z.string().min(1),
    isVisible: z.boolean(),
    sortOrder: z.number().int(),
    title: z.string().optional().nullable(),
  })
);

export type SectionInput = z.infer<typeof sectionInputSchema>;

export async function saveHomepageSections(raw: SectionInput) {
  await requireStaff();
  const sections = sectionInputSchema.parse(raw);

  await Promise.all(
    sections.map((s) =>
      db.homepageSection.upsert({
        where: { key: s.key },
        create: { key: s.key, isVisible: s.isVisible, sortOrder: s.sortOrder, title: s.title || null },
        update: { isVisible: s.isVisible, sortOrder: s.sortOrder, title: s.title || null },
      })
    )
  );

  revalidatePath("/admin/homepage");
  revalidatePath("/");
}
