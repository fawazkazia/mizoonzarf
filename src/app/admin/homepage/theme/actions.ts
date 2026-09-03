"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { homepageThemeInputSchema, type HomepageThemeInput } from "@/lib/validation/homepage-theme";
import type { Prisma } from "@/generated/prisma/client";

export async function updateHomepageTheme(raw: HomepageThemeInput) {
  const session = await requirePermission("settings.manageWebsite");
  const input = homepageThemeInputSchema.parse(raw);

  await db.setting.upsert({
    where: { key: "homepageTheme" },
    create: { key: "homepageTheme", value: input as Prisma.InputJsonValue, group: "homepageTheme" },
    update: { value: input as Prisma.InputJsonValue },
  });

  await logStaffActivity({ actorId: session.user.id, action: "HOMEPAGE_THEME_UPDATED", module: "settings" });
  revalidatePath("/", "layout");
  revalidatePath("/admin/homepage/theme");
}
