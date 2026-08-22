"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Checkbox, Fieldset } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { createBanner, updateBanner } from "./actions";
import type { BannerInput } from "@/lib/validation/admin-banner";

export interface BannerFormInitial {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string | null;
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
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [mobileImageUrl, setMobileImageUrl] = useState<string | null>(initial?.mobileImageUrl ?? null);
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
      imageUrl,
      mobileImageUrl,
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

      <Fieldset title="Images">
        <div>
          <Field label="Desktop Image">
            <SingleImageUploader value={imageUrl} onChange={setImageUrl} />
          </Field>
        </div>
        <div>
          <Field label="Mobile Image (optional)" hint="Falls back to the desktop image when empty.">
            <SingleImageUploader value={mobileImageUrl} onChange={setMobileImageUrl} />
          </Field>
        </div>
      </Fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : initial ? "Save Changes" : "Create Banner"}
      </Button>
    </form>
  );
}
