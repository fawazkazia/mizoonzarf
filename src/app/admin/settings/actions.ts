"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { settingsInputSchema, type SettingsInput } from "@/lib/validation/admin-settings";
import type { Prisma } from "@/generated/prisma/client";

export async function updateSettings(raw: SettingsInput) {
  const session = await requirePermission("settings.edit");
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

  await logStaffActivity({ actorId: session.user.id, action: "SETTINGS_UPDATED", module: "settings", after: { keys: Object.keys(input) } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
