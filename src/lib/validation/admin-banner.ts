import { z } from "zod";

export const bannerInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  titleColor: z.string().optional().nullable(),
  subtitleColor: z.string().optional().nullable(),
  titleSize: z.enum(["SMALL", "MEDIUM", "LARGE"]).default("MEDIUM"),
  contentPositionX: z.number().min(0).max(100).optional().nullable(),
  contentPositionY: z.number().min(0).max(100).optional().nullable(),
  imageUrl: z.string().min(1, "Image is required"),
  mobileImageUrl: z.string().optional().nullable(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  position: z.enum(["HERO", "PROMO", "CATEGORY", "POPUP"]),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type BannerInput = z.infer<typeof bannerInputSchema>;
