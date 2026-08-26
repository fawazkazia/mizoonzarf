import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BannerForm } from "../../BannerForm";

export const metadata = { title: "Edit Banner" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: PageProps) {
  const { id } = await params;
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Edit Banner</h1>
      <BannerForm
        initial={{
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle ?? "",
          titleColor: banner.titleColor,
          subtitleColor: banner.subtitleColor,
          titleSize: banner.titleSize,
          contentPositionX: banner.contentPositionX,
          contentPositionY: banner.contentPositionY,
          imageUrl: banner.imageUrl,
          mobileImageUrl: banner.mobileImageUrl,
          ctaText: banner.ctaText ?? "",
          ctaLink: banner.ctaLink ?? "",
          position: banner.position,
          sortOrder: banner.sortOrder,
          isActive: banner.isActive,
          startDate: banner.startDate ? banner.startDate.toISOString().slice(0, 10) : "",
          endDate: banner.endDate ? banner.endDate.toISOString().slice(0, 10) : "",
        }}
      />
    </div>
  );
}
