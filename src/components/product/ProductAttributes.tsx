import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { SIZE_GUIDES } from "@/lib/size-guides";
import { formatINR } from "@/lib/currency";

interface Props {
  description: string;
  material: string | null;
  fitInfo: string | null;
  careInstructions: string | null;
  sizeGuideType: string | null;
  fragranceFamily: string | null;
  fragranceNotes: { top?: string[]; heart?: string[]; base?: string[] } | null;
  concentration: string | null;
  attributes?: Record<string, string | number> | null;
  tags?: string[];
  freeShippingThreshold?: number;
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-t border-line py-3.5 first:border-t-0" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-[0.08em]">
        {title}
        <Plus size={14} className="transition-transform group-open:hidden" />
        <Minus size={14} className="hidden transition-transform group-open:block" />
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

export function ProductAttributes({
  description,
  material,
  fitInfo,
  careInstructions,
  sizeGuideType,
  fragranceFamily,
  fragranceNotes,
  concentration,
  attributes,
  tags,
  freeShippingThreshold,
}: Props) {
  const sizeGuide = sizeGuideType ? SIZE_GUIDES[sizeGuideType] : null;
  const attributeEntries = attributes ? Object.entries(attributes) : [];

  return (
    <div>
      <Section title="Description" defaultOpen>
        <p>{description}</p>
      </Section>

      {(material || fitInfo) && (
        <Section title="Material & Fit">
          {material && <p>Material: {material}</p>}
          {fitInfo && <p className="mt-1">{fitInfo}</p>}
        </Section>
      )}

      {attributeEntries.length > 0 && (
        <Section title="Details">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            {attributeEntries.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs uppercase tracking-[0.06em] text-ink-soft/70">{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {sizeGuide && (
        <Section title="Size Guide">
          {sizeGuide.note && <p className="mb-3">{sizeGuide.note}</p>}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line">
                <th className="py-1.5">Size</th>
                <th className="py-1.5">Measurements</th>
              </tr>
            </thead>
            <tbody>
              {sizeGuide.rows.map((row) => (
                <tr key={row.size} className="border-b border-line/50">
                  <td className="py-1.5">{row.size}</td>
                  <td className="py-1.5">{row.measurements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {(fragranceFamily || fragranceNotes || concentration) && (
        <Section title="Fragrance Notes">
          {fragranceFamily && <p>Family: {fragranceFamily}</p>}
          {concentration && <p className="mt-1">Concentration: {concentration}</p>}
          {fragranceNotes?.top && <p className="mt-1">Top Notes: {fragranceNotes.top.join(", ")}</p>}
          {fragranceNotes?.heart && <p className="mt-1">Heart Notes: {fragranceNotes.heart.join(", ")}</p>}
          {fragranceNotes?.base && <p className="mt-1">Base Notes: {fragranceNotes.base.join(", ")}</p>}
        </Section>
      )}

      {careInstructions && (
        <Section title="Care Instructions">
          <p>{careInstructions}</p>
        </Section>
      )}

      <Section title="Shipping & Returns">
        <p>
          {freeShippingThreshold
            ? `Free standard shipping on orders over ${formatINR(freeShippingThreshold)}.`
            : "Standard shipping fees apply at checkout."}{" "}
          Easy returns within 14 days of delivery.
        </p>
      </Section>

      {tags && tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
          {tags.map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="border border-line px-2.5 py-1 text-xs capitalize text-ink-soft hover:border-ink">
              {tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
