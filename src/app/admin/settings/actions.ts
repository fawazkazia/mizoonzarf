"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { SETTINGS_ROLES } from "@/lib/admin-permissions";
import { settingsInputSchema, type SettingsInput } from "@/lib/validation/admin-settings";
import type { Prisma } from "@/generated/prisma/client";

export async function updateSettings(raw: SettingsInput) {
  await requireRole(SETTINGS_ROLES);
  const input = settingsInputSchema.parse(raw);

  await Promise.all(
    Object.entries(input).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue, group: typeof value === "object" ? key : "general" },
        update: { value: value as Prisma.InputJsonValue },
      })
    )
  );

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
