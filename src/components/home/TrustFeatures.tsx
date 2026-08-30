import { ShieldCheck, Lock, Truck, RotateCcw, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";

export type TrustFeatureIcon = "authentic" | "secure" | "delivery" | "returns";

const ICONS: Record<TrustFeatureIcon, LucideIcon> = {
  authentic: ShieldCheck,
  secure: Lock,
  delivery: Truck,
  returns: RotateCcw,
};

export interface TrustFeatureItem {
  icon: TrustFeatureIcon;
  title: string;
  text: string;
}

/** Clean 4-up trust-badge strip ("Why MIZOON ZARF") — icon + short title/text,
 * no images, so it stays simple to keep admin-editable without an upload step. */
export function TrustFeatures({
  items,
  heading = "Why MIZOON ZARF",
}: {
  items: TrustFeatureItem[];
  heading?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-line bg-paper-dim py-10 sm:py-12">
      <Container>
        <FadeIn className="mb-8 text-center">
          <h2 className="hp-heading font-display text-2xl sm:text-3xl">{heading}</h2>
        </FadeIn>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-4">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <div key={i} className="flex flex-col items-center gap-2.5 text-center">
                <Icon size={26} strokeWidth={1.25} className="hp-accent-text" />
                <p className="font-display text-sm sm:text-base">{item.title}</p>
                <p className="hp-body text-xs text-ink-soft">{item.text}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
