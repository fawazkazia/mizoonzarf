"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Fieldset } from "@/components/admin/FormField";
import {
  HOMEPAGE_HEADING_FONTS,
  HOMEPAGE_BODY_FONTS,
  HEADING_FONT_LABELS,
  BODY_FONT_LABELS,
  HEADING_WEIGHTS,
  LETTER_SPACINGS,
  LINE_HEIGHTS,
  type HomepageHeadingFont,
  type HomepageBodyFont,
  type HomepageHeadingWeight,
  type HomepageLetterSpacing,
  type HomepageLineHeight,
} from "@/lib/homepage-theme";
import { updateHomepageTheme } from "./actions";
import type { SiteSettings } from "@/lib/settings";

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[42px] w-12 shrink-0 cursor-pointer border border-line"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 uppercase" />
      </div>
    </Field>
  );
}

export function ThemeForm({ initial }: { initial: SiteSettings["homepageTheme"] }) {
  const router = useRouter();
  const [accent, setAccent] = useState(initial.colors.accent);
  const [accentSoft, setAccentSoft] = useState(initial.colors.accentSoft);
  const [surface, setSurface] = useState(initial.colors.surface);
  const [surfaceDim, setSurfaceDim] = useState(initial.colors.surfaceDim);
  const [ink, setInk] = useState(initial.colors.ink);
  const [headingFont, setHeadingFont] = useState<HomepageHeadingFont>(initial.typography.headingFont);
  const [bodyFont, setBodyFont] = useState<HomepageBodyFont>(initial.typography.bodyFont);
  const [headingWeight, setHeadingWeight] = useState<HomepageHeadingWeight>(initial.typography.headingWeight);
  const [letterSpacing, setLetterSpacing] = useState<HomepageLetterSpacing>(initial.typography.letterSpacing);
  const [lineHeight, setLineHeight] = useState<HomepageLineHeight>(initial.typography.lineHeight);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHomepageTheme({
        colors: { accent, accentSoft, surface, surfaceDim, ink },
        typography: { headingFont, bodyFont, headingWeight, letterSpacing, lineHeight },
      });
      toast.success("Homepage theme updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Colors">
        <ColorField label="Accent" value={accent} onChange={setAccent} hint="Section headings, dividers." />
        <ColorField label="Accent (Soft)" value={accentSoft} onChange={setAccentSoft} hint="Eyebrow labels on dark backgrounds." />
        <ColorField label="Surface" value={surface} onChange={setSurface} />
        <ColorField label="Surface (Dim)" value={surfaceDim} onChange={setSurfaceDim} />
        <ColorField label="Ink" value={ink} onChange={setInk} />
      </Fieldset>

      <Fieldset title="Typography">
        <Field label="Heading Font">
          <Select value={headingFont} onChange={(e) => setHeadingFont(e.target.value as HomepageHeadingFont)}>
            {HOMEPAGE_HEADING_FONTS.map((f) => (
              <option key={f} value={f}>
                {HEADING_FONT_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Body Font">
          <Select value={bodyFont} onChange={(e) => setBodyFont(e.target.value as HomepageBodyFont)}>
            {HOMEPAGE_BODY_FONTS.map((f) => (
              <option key={f} value={f}>
                {BODY_FONT_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Heading Weight">
          <Select value={headingWeight} onChange={(e) => setHeadingWeight(e.target.value as HomepageHeadingWeight)}>
            {HEADING_WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Letter Spacing">
          <Select value={letterSpacing} onChange={(e) => setLetterSpacing(e.target.value as HomepageLetterSpacing)}>
            {LETTER_SPACINGS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Line Height">
          <Select value={lineHeight} onChange={(e) => setLineHeight(e.target.value as HomepageLineHeight)}>
            {LINE_HEIGHTS.map((h) => (
              <option key={h} value={h} className="capitalize">
                {h}
              </option>
            ))}
          </Select>
        </Field>
      </Fieldset>

      <Button type="submit" size="lg" disabled={loading} className="self-start">
        {loading ? "Saving..." : "Save Theme"}
      </Button>
    </form>
  );
}
