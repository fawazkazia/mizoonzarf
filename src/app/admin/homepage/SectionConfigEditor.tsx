"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Input } from "@/components/admin/FormField";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { ObjectPositionSelect } from "@/components/admin/ObjectPositionSelect";
import { dimensionHint } from "@/lib/image-dimensions";
import {
  resolveSectionConfig,
  type HomepageSectionConfigKey,
  type ProductRailConfig,
  type VerticalFeatureConfig,
  type SocialGalleryConfig,
  type NewsletterConfig,
  type ShopByCategoryRailConfig,
  type FeaturedCollectionsConfig,
  type StyleFinderConfig,
  type AdBannerConfig,
} from "@/lib/validation/homepage-section-config";

const PRODUCT_RAIL_KEYS = new Set(["newArrivals", "trending", "bestSellers", "recommendedProducts"]);
const VERTICAL_FEATURE_KEYS = new Set(["perfumeFeature", "jewelleryFeature", "mensFeature", "womensFeature", "kidsFeature"]);

/** Renders the right content-editing form for one homepage section, based on
 * its key. `config` is the section's raw (possibly null/stale) stored JSON;
 * `onChange` reports the full updated config object back to the parent form
 * on every field edit — HomepageSectionsForm holds it in its own `items`
 * state and saves everything together via one "Save Layout" submit. */
export function SectionConfigEditor({
  sectionKey,
  config,
  onChange,
}: {
  sectionKey: HomepageSectionConfigKey;
  config: Record<string, unknown> | null;
  onChange: (config: Record<string, unknown>) => void;
}) {
  if (sectionKey === "shopByCategoryRail") {
    return <ShopByCategoryRailEditor config={resolveSectionConfig(sectionKey, config)} onChange={onChange} />;
  }
  if (sectionKey === "featuredCollections") {
    return <FeaturedCollectionsEditor config={resolveSectionConfig(sectionKey, config)} onChange={onChange} />;
  }
  if (PRODUCT_RAIL_KEYS.has(sectionKey)) {
    return <ProductRailEditor config={resolveSectionConfig(sectionKey, config) as ProductRailConfig} onChange={onChange} />;
  }
  if (VERTICAL_FEATURE_KEYS.has(sectionKey)) {
    return <VerticalFeatureEditor config={resolveSectionConfig(sectionKey, config) as VerticalFeatureConfig} onChange={onChange} />;
  }
  if (sectionKey === "socialGallery") {
    return <SocialGalleryEditor config={resolveSectionConfig(sectionKey, config)} onChange={onChange} />;
  }
  if (sectionKey === "newsletter") {
    return <NewsletterEditor config={resolveSectionConfig(sectionKey, config)} onChange={onChange} />;
  }
  if (sectionKey === "styleFinder") {
    return <StyleFinderEditor config={resolveSectionConfig(sectionKey, config)} onChange={onChange} />;
  }
  if (sectionKey === "adBanner" || sectionKey === "adBanner2") {
    return <AdBannerEditor config={resolveSectionConfig(sectionKey, config)} onChange={onChange} />;
  }
  return null;
}

function ShopByCategoryRailEditor({ config, onChange }: { config: ShopByCategoryRailConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [heading, setHeading] = useState(config.heading);
  return (
    <Field label="Heading">
      <Input
        value={heading}
        onChange={(e) => {
          setHeading(e.target.value);
          onChange({ heading: e.target.value });
        }}
      />
    </Field>
  );
}

function FeaturedCollectionsEditor({ config, onChange }: { config: FeaturedCollectionsConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [heading, setHeading] = useState(config.heading);
  const [ctaText, setCtaText] = useState(config.ctaText);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Heading">
        <Input
          value={heading}
          onChange={(e) => {
            setHeading(e.target.value);
            onChange({ heading: e.target.value, ctaText });
          }}
        />
      </Field>
      <Field label="Button Text" hint='Shown as "{text} →" on each tile.'>
        <Input
          value={ctaText}
          onChange={(e) => {
            setCtaText(e.target.value);
            onChange({ heading, ctaText: e.target.value });
          }}
        />
      </Field>
    </div>
  );
}

function ProductRailEditor({ config, onChange }: { config: ProductRailConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow);
  const [title, setTitle] = useState(config.title);
  const [subtitle, setSubtitle] = useState(config.subtitle);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Eyebrow (optional)">
        <Input
          value={eyebrow}
          onChange={(e) => {
            setEyebrow(e.target.value);
            onChange({ eyebrow: e.target.value, title, subtitle });
          }}
        />
      </Field>
      <Field label="Title">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onChange({ eyebrow, title: e.target.value, subtitle });
          }}
        />
      </Field>
      <Field label="Subtitle (optional)">
        <Input
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            onChange({ eyebrow, title, subtitle: e.target.value });
          }}
        />
      </Field>
    </div>
  );
}

function VerticalFeatureEditor({ config, onChange }: { config: VerticalFeatureConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow);
  return (
    <Field label="Eyebrow">
      <Input
        value={eyebrow}
        onChange={(e) => {
          setEyebrow(e.target.value);
          onChange({ eyebrow: e.target.value });
        }}
      />
    </Field>
  );
}

function StyleFinderEditor({ config, onChange }: { config: StyleFinderConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow);
  const [heading, setHeading] = useState(config.heading);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Eyebrow">
        <Input
          value={eyebrow}
          onChange={(e) => {
            setEyebrow(e.target.value);
            onChange({ eyebrow: e.target.value, heading });
          }}
        />
      </Field>
      <Field label="Heading">
        <Input
          value={heading}
          onChange={(e) => {
            setHeading(e.target.value);
            onChange({ eyebrow, heading: e.target.value });
          }}
        />
      </Field>
      <p className="text-xs text-ink-soft sm:col-span-2">
        The quiz questions, options and colour swatches aren&apos;t editable here — they drive product filtering, not just display copy.
      </p>
    </div>
  );
}

function AdBannerEditor({ config, onChange }: { config: AdBannerConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow);
  const [heading, setHeading] = useState(config.heading);
  const [subheading, setSubheading] = useState(config.subheading);
  const [ctaText, setCtaText] = useState(config.ctaText);
  const [ctaLink, setCtaLink] = useState(config.ctaLink);
  const [imageUrl, setImageUrl] = useState<string | null>(config.imageUrl ?? null);
  const [objectPosition, setObjectPosition] = useState(config.objectPosition ?? null);

  function emit(next: Partial<AdBannerConfig>) {
    onChange({ eyebrow, heading, subheading, ctaText, ctaLink, imageUrl, objectPosition, ...next });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Eyebrow (optional)" hint="Small badge text above the heading.">
        <Input
          value={eyebrow}
          onChange={(e) => {
            setEyebrow(e.target.value);
            emit({ eyebrow: e.target.value });
          }}
        />
      </Field>
      <Field label="Heading">
        <Input
          value={heading}
          onChange={(e) => {
            setHeading(e.target.value);
            emit({ heading: e.target.value });
          }}
        />
      </Field>
      <Field label="Subheading (optional)" hint="Hidden on small screens.">
        <Input
          value={subheading}
          onChange={(e) => {
            setSubheading(e.target.value);
            emit({ subheading: e.target.value });
          }}
        />
      </Field>
      <Field label="Button Text">
        <Input
          value={ctaText}
          onChange={(e) => {
            setCtaText(e.target.value);
            emit({ ctaText: e.target.value });
          }}
        />
      </Field>
      <Field label="Link" hint="Where the whole banner links to, e.g. /women or a collection URL.">
        <Input
          value={ctaLink}
          onChange={(e) => {
            setCtaLink(e.target.value);
            emit({ ctaLink: e.target.value });
          }}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Background Image (optional)" hint="Full-bleed, slim strip — a wide, simple image works best.">
          <SingleImageUploader
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              emit({ imageUrl: url });
            }}
          />
        </Field>
      </div>
      <ObjectPositionSelect
        value={objectPosition}
        onChange={(pos) => {
          setObjectPosition(pos);
          emit({ objectPosition: pos });
        }}
      />
    </div>
  );
}

function NewsletterEditor({ config, onChange }: { config: NewsletterConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [heading, setHeading] = useState(config.heading);
  const [subtitle, setSubtitle] = useState(config.subtitle);
  const [placeholder, setPlaceholder] = useState(config.placeholder);
  const [imageUrl, setImageUrl] = useState<string | null>(config.imageUrl ?? null);
  const [objectPosition, setObjectPosition] = useState(config.objectPosition ?? null);

  function emit(next: Partial<NewsletterConfig>) {
    onChange({ heading, subtitle, placeholder, imageUrl, objectPosition, ...next });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Heading">
        <Input
          value={heading}
          onChange={(e) => {
            setHeading(e.target.value);
            emit({ heading: e.target.value });
          }}
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            emit({ subtitle: e.target.value });
          }}
        />
      </Field>
      <Field label="Email Field Placeholder">
        <Input
          value={placeholder}
          onChange={(e) => {
            setPlaceholder(e.target.value);
            emit({ placeholder: e.target.value });
          }}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Panel Image (optional)" hint={`Desktop only. ${dimensionHint("newsletterImage")}`}>
          <SingleImageUploader
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              emit({ imageUrl: url });
            }}
          />
        </Field>
      </div>
      <ObjectPositionSelect
        value={objectPosition}
        onChange={(pos) => {
          setObjectPosition(pos);
          emit({ objectPosition: pos });
        }}
      />
    </div>
  );
}

function SocialGalleryEditor({ config, onChange }: { config: SocialGalleryConfig; onChange: (c: Record<string, unknown>) => void }) {
  const [heading, setHeading] = useState(config.heading);
  const [subtitle, setSubtitle] = useState(config.subtitle);
  const [images, setImages] = useState(config.images);

  function emit(next: { heading?: string; subtitle?: string; images?: typeof images }) {
    onChange({ heading, subtitle, images, ...next });
  }

  function updateImage(i: number, patch: Partial<(typeof images)[number]>) {
    const next = images.map((img, idx) => (idx === i ? { ...img, ...patch } : img));
    setImages(next);
    emit({ images: next });
  }

  function addImage() {
    if (images.length >= 8) return;
    const next = [...images, { url: "", alt: "Style inspiration", link: null, objectPosition: null }];
    setImages(next);
    emit({ images: next });
  }

  function removeImage(i: number) {
    if (images.length <= 2) return;
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    emit({ images: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Heading">
          <Input
            value={heading}
            onChange={(e) => {
              setHeading(e.target.value);
              emit({ heading: e.target.value });
            }}
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              emit({ subtitle: e.target.value });
            }}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.08em] text-ink-soft">
          Images ({images.length}/8 — the 1st and 6th render wider)
        </p>
        <div className="flex flex-col gap-3">
          {images.map((img, i) => (
            <div key={i} className="flex flex-col gap-2 border border-line p-3 sm:flex-row sm:items-start">
              <SingleImageUploader
                value={img.url || null}
                onChange={(url) => updateImage(i, { url: url ?? "" })}
                expectedDimensions={i === 0 || i === 5 ? { width: 1200, height: 600 } : { width: 600, height: 600 }}
              />
              <div className="flex flex-1 flex-col gap-2">
                <Input placeholder="Alt text" value={img.alt} onChange={(e) => updateImage(i, { alt: e.target.value })} />
                <Input
                  placeholder="Link (optional)"
                  value={img.link ?? ""}
                  onChange={(e) => updateImage(i, { link: e.target.value || null })}
                />
                <ObjectPositionSelect
                  label="Position"
                  value={img.objectPosition ?? null}
                  onChange={(pos) => updateImage(i, { objectPosition: pos })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                disabled={images.length <= 2}
                className="self-start text-ink-soft hover:text-sale disabled:opacity-30"
                aria-label="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addImage}
          disabled={images.length >= 8}
          className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-ink-soft hover:text-ink disabled:opacity-30"
        >
          <Plus size={14} /> Add Image
        </button>
      </div>
    </div>
  );
}
