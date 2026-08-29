"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Checkbox, Fieldset } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { BannerContentPositionPicker, type ContentPosition } from "@/components/admin/BannerContentPositionPicker";
import { ObjectPositionSelect } from "@/components/admin/ObjectPositionSelect";
import { createBanner, updateBanner } from "./actions";
import type { BannerInput } from "@/lib/validation/admin-banner";
import type { ObjectPositionValue } from "@/lib/object-position";

/** Matches how each position actually renders on the storefront (Hero,
 * PromoBanner, CategoryHero) so the recommendation isn't a guess. */
const BANNER_DIMENSIONS: Record<BannerInput["position"], { desktop: string; mobile: string }> = {
  HERO: { desktop: "1920 × 720px", mobile: "750 × 1000px" },
  PROMO: { desktop: "1600 × 900px", mobile: "750 × 1000px" },
  CATEGORY: { desktop: "1920 × 600px", mobile: "750 × 800px" },
  POPUP: { desktop: "900 × 1100px", mobile: "700 × 900px" },
};

/** Only Hero and Promo render the title/subtitle/button as an overlay on the
 * image, so only those positions offer the drag-to-position picker. */
const POSITIONS_WITH_CONTENT_PICKER: BannerInput["position"][] = ["HERO", "PROMO"];

function parseDims(dims: string): { width: number; height: number } {
  const [width, height] = dims.replace("px", "").split("×").map((n) => parseInt(n.trim(), 10));
  return { width, height };
}

function dimsToAspectRatio(dims: string) {
  const { width, height } = parseDims(dims);
  return `${width} / ${height}`;
}

export interface BannerFormInitial {
  id: string;
  title: string;
  subtitle: string;
  titleColor: string | null;
  subtitleColor: string | null;
  titleSize: BannerInput["titleSize"];
  contentPositionX: number | null;
  contentPositionY: number | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  imageObjectPosition: ObjectPositionValue | null;
  ctaText: string;
  ctaLink: string;
  position: BannerInput["position"];
  sortOrder: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export function BannerForm({ initial }: { initial?: BannerFormInitial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [titleColor, setTitleColor] = useState<string | null>(initial?.titleColor ?? null);
  const [subtitleColor, setSubtitleColor] = useState<string | null>(initial?.subtitleColor ?? null);
  const [titleSize, setTitleSize] = useState<BannerInput["titleSize"]>(initial?.titleSize ?? "MEDIUM");
  const [contentPosition, setContentPosition] = useState<ContentPosition | null>(
    initial?.contentPositionX != null && initial?.contentPositionY != null
      ? { x: initial.contentPositionX, y: initial.contentPositionY }
      : null
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [mobileImageUrl, setMobileImageUrl] = useState<string | null>(initial?.mobileImageUrl ?? null);
  const [imageObjectPosition, setImageObjectPosition] = useState<ObjectPositionValue | null>(initial?.imageObjectPosition ?? null);
  const [ctaText, setCtaText] = useState(initial?.ctaText ?? "");
  const [ctaLink, setCtaLink] = useState(initial?.ctaLink ?? "");
  const [position, setPosition] = useState<BannerInput["position"]>(initial?.position ?? "HERO");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Please upload an image.");
      return;
    }
    const payload: BannerInput = {
      title,
      subtitle: subtitle || undefined,
      titleColor,
      subtitleColor,
      titleSize,
      contentPositionX: contentPosition?.x ?? null,
      contentPositionY: contentPosition?.y ?? null,
      imageUrl,
      mobileImageUrl,
      imageObjectPosition,
      ctaText: ctaText || undefined,
      ctaLink: ctaLink || undefined,
      position,
      sortOrder,
      isActive,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    setLoading(true);
    try {
      if (initial) {
        await updateBanner(initial.id, payload);
        toast.success("Banner updated.");
      } else {
        await createBanner(payload);
        toast.success("Banner created.");
      }
      router.push("/admin/banners");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Details">
        <Field label="Title">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </Field>
        <Field label="Position">
          <Select value={position} onChange={(e) => setPosition(e.target.value as BannerInput["position"])}>
            <option value="HERO">Hero (homepage slider)</option>
            <option value="PROMO">Promo (homepage banner)</option>
            <option value="CATEGORY">Category (per-vertical PLP banner)</option>
            <option value="POPUP">Popup</option>
          </Select>
        </Field>
        <Field label="Sort Order">
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </Field>
        <Field label="Button Text">
          <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
        </Field>
        <Field
          label="Button Link"
          hint={position === "CATEGORY" ? "Start with the category path, e.g. /men, so it links this banner to that PLP." : undefined}
        >
          <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/men" />
        </Field>
        <Field label="Start Date (optional)">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="End Date (optional)">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <div className="flex items-center">
          <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        </div>
      </Fieldset>

      <Fieldset title="Text Style">
        <Field label="Title Color (optional)" hint="Leave unset to use the default theme color for this position.">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={titleColor ?? "#faf7f2"}
              onChange={(e) => setTitleColor(e.target.value)}
              className="h-10 w-16 cursor-pointer border border-line bg-paper p-1"
            />
            {titleColor && (
              <button type="button" onClick={() => setTitleColor(null)} className="text-xs text-ink-soft underline">
                Use default
              </button>
            )}
          </div>
        </Field>
        <Field label="Subtitle Color (optional)" hint="Leave unset to use the default theme color for this position.">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={subtitleColor ?? "#d8c39a"}
              onChange={(e) => setSubtitleColor(e.target.value)}
              className="h-10 w-16 cursor-pointer border border-line bg-paper p-1"
            />
            {subtitleColor && (
              <button type="button" onClick={() => setSubtitleColor(null)} className="text-xs text-ink-soft underline">
                Use default
              </button>
            )}
          </div>
        </Field>
        <Field label="Text Size" hint="Scales both the title and subtitle.">
          <Select value={titleSize} onChange={(e) => setTitleSize(e.target.value as BannerInput["titleSize"])}>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
          </Select>
        </Field>
      </Fieldset>

      <Fieldset title="Images">
        <div>
          <Field label="Desktop Image" hint={`Recommended size: ${BANNER_DIMENSIONS[position].desktop}`}>
            <SingleImageUploader value={imageUrl} onChange={setImageUrl} expectedDimensions={parseDims(BANNER_DIMENSIONS[position].desktop)} />
          </Field>
        </div>
        <div>
          <Field
            label="Mobile Image (optional)"
            hint={`Falls back to the desktop image when empty. Recommended size: ${BANNER_DIMENSIONS[position].mobile}`}
          >
            <SingleImageUploader value={mobileImageUrl} onChange={setMobileImageUrl} expectedDimensions={parseDims(BANNER_DIMENSIONS[position].mobile)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <ObjectPositionSelect value={imageObjectPosition} onChange={setImageObjectPosition} />
        </div>
      </Fieldset>

      {POSITIONS_WITH_CONTENT_PICKER.includes(position) && (
        <Fieldset title="Content Position">
          <div className="sm:col-span-2">
            <Field label="Title / Subtitle / Button Placement" hint="Drag or click on the preview to move the title, subtitle and button as a group. Desktop only — mobile keeps its standard stacked layout.">
              <BannerContentPositionPicker
                value={contentPosition}
                onChange={setContentPosition}
                imageUrl={imageUrl}
                aspectRatio={dimsToAspectRatio(BANNER_DIMENSIONS[position].desktop)}
              />
            </Field>
          </div>
        </Fieldset>
      )}

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : initial ? "Save Changes" : "Create Banner"}
      </Button>
    </form>
  );
}
