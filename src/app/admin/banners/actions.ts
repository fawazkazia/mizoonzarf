"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { bannerInputSchema, type BannerInput } from "@/lib/validation/admin-banner";

function normalize(input: BannerInput) {
  return {
    title: input.title,
    subtitle: input.subtitle || null,
    titleColor: input.titleColor || null,
    subtitleColor: input.subtitleColor || null,
    titleSize: input.titleSize,
    contentPositionX: input.contentPositionX ?? null,
    contentPositionY: input.contentPositionY ?? null,
    imageUrl: input.imageUrl,
    mobileImageUrl: input.mobileImageUrl || null,
    imageObjectPosition: input.imageObjectPosition || null,
    ctaText: input.ctaText || null,
    ctaLink: input.ctaLink || null,
    position: input.position,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
  };
}

function revalidateBannerPaths() {
  revalidatePath("/admin/banners");
  revalidatePath("/", "layout");
}

export async function createBanner(raw: BannerInput) {
  const session = await requirePermission("marketing.manageBanners");
  const input = bannerInputSchema.parse(raw);
  const banner = await db.banner.create({ data: normalize(input) });
  await logStaffActivity({ actorId: session.user.id, action: "BANNER_CREATED", module: "marketing", entityType: "Banner", entityId: banner.id, after: { title: input.title } });
  revalidateBannerPaths();
  return { id: banner.id };
}

export async function updateBanner(id: string, raw: BannerInput) {
  const session = await requirePermission("marketing.manageBanners");
  const input = bannerInputSchema.parse(raw);
  await db.banner.update({ where: { id }, data: normalize(input) });
  await logStaffActivity({ actorId: session.user.id, action: "BANNER_UPDATED", module: "marketing", entityType: "Banner", entityId: id, after: { title: input.title } });
  revalidateBannerPaths();
  return { id };
}

export async function deleteBanner(id: string) {
  const session = await requirePermission("marketing.manageBanners");
  await db.banner.delete({ where: { id } });
  await logStaffActivity({ actorId: session.user.id, action: "BANNER_DELETED", module: "marketing", entityType: "Banner", entityId: id });
  revalidateBannerPaths();
}
