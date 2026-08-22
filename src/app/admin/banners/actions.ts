"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { bannerInputSchema, type BannerInput } from "@/lib/validation/admin-banner";

function normalize(input: BannerInput) {
  return {
    title: input.title,
    subtitle: input.subtitle || null,
    imageUrl: input.imageUrl,
    mobileImageUrl: input.mobileImageUrl || null,
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
  await requireStaff();
  const input = bannerInputSchema.parse(raw);
  const banner = await db.banner.create({ data: normalize(input) });
  revalidateBannerPaths();
  return { id: banner.id };
}

export async function updateBanner(id: string, raw: BannerInput) {
  await requireStaff();
  const input = bannerInputSchema.parse(raw);
  await db.banner.update({ where: { id }, data: normalize(input) });
  revalidateBannerPaths();
  return { id };
}

export async function deleteBanner(id: string) {
  await requireStaff();
  await db.banner.delete({ where: { id } });
  revalidateBannerPaths();
}
