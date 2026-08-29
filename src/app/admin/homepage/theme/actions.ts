"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { homepageThemeInputSchema, type HomepageThemeInput } from "@/lib/validation/homepage-theme";
import type { Prisma } from "@/generated/prisma/client";

export async function updateHomepageTheme(raw: HomepageThemeInput) {
  await requireStaff();
  const input = homepageThemeInputSchema.parse(raw);

  await db.setting.upsert({
    where: { key: "homepageTheme" },
    create: { key: "homepageTheme", value: input as Prisma.InputJsonValue, group: "homepageTheme" },
    update: { value: input as Prisma.InputJsonValue },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/homepage/theme");
}
