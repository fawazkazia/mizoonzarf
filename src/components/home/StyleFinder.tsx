"use client";

import { useState } from "react";
import {
  Sparkles,
  Gem,
  Briefcase,
  Shirt,
  Moon,
  Palmtree,
  Users,
  Mars,
  Venus,
  Baby,
  Crown,
  Minus,
  Flame,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/utils";

const OCCASIONS = ["wedding", "office", "casual", "evening", "resort"];
const OCCASION_ICONS: Record<string, LucideIcon> = {
  wedding: Gem,
  office: Briefcase,
  casual: Shirt,
  evening: Moon,
  resort: Palmtree,
};
const GENDERS = [
  { value: "any", label: "Any" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Kids" },
];
const GENDER_ICONS: Record<string, LucideIcon> = {
  any: Users,
  men: Mars,
  women: Venus,
  kids: Baby,
};
const STYLES = ["classic", "minimal", "bold", "romantic"];
const STYLE_ICONS: Record<string, LucideIcon> = {
  classic: Crown,
  minimal: Minus,
  bold: Flame,
  romantic: Heart,
};
const COLOR_SWATCHES = [
  { name: "Black", hex: "#14130f" },
  { name: "White", hex: "#faf7f2" },
  { name: "Gold", hex: "#a9803f" },
  { name: "Navy", hex: "#1b2a4a" },
  { name: "Red", hex: "#a3372f" },
  { name: "Beige", hex: "#d8c9ac" },
];
const BUDGETS = [
  { value: "under_200", label: "Under 200" },
  { value: "200_500", label: "200 – 500" },
  { value: "500_1000", label: "500 – 1,000" },
  { value: "over_1000", label: "1,000+" },
];

interface Answers {
  occasion: string;
  gender: string;
  style: string;
  color: string;
  budget: string;
}

const EMPTY_ANSWERS: Answers = { occasion: "", gender: "", style: "", color: "", budget: "" };
const STEPS = ["occasion", "gender", "style", "color", "budget"] as const;

function StepGrid({
  label,
  options,
  onSelect,
  icons,
  gridClassName = "grid-cols-2 sm:grid-cols-3",
}: {
  label: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  icons?: Record<string, LucideIcon>;
  gridClassName?: string;
}) {
  return (
    <div>
      <p className="mb-4 text-center text-sm uppercase tracking-[0.14em] text-paper/70">{label}</p>
      <div className={cn("mx-auto grid max-w-xl gap-3", gridClassName)}>
        {options.map((opt) => {
          const Icon = icons?.[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-paper/15 bg-paper/[0.03] px-3 py-3.5 text-sm capitalize transition-all duration-[var(--dur-1)] hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-ink hover:shadow-[0_10px_28px_-10px_rgba(169,128,63,0.55)]"
            >
              {Icon && (
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="text-gold-soft transition-colors duration-[var(--dur-1)] group-hover:text-ink"
                />
              )}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Presentation-only restyle: same untouched /api/style-finder rule-based
 * filter, now a stepped one-question-at-a-time flow instead of five stacked
 * pill groups. Framed as "our stylists' picks" rather than implying AI,
 * since this is a plain filter, not a generative call. */
export function StyleFinder({ eyebrow = "Style Finder", heading = "Find Your Style" }: { eyebrow?: string; heading?: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [results, setResults] = useState<ProductCardData[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function findStyle(finalAnswers: Answers) {
    setLoading(true);
    const params = new URLSearchParams();
    if (finalAnswers.occasion) params.set("occasion", finalAnswers.occasion);
    if (finalAnswers.gender) params.set("gender", finalAnswers.gender);
    if (finalAnswers.style) params.set("style", finalAnswers.style);
    if (finalAnswers.color) params.set("color", finalAnswers.color);
    if (finalAnswers.budget) params.set("budget", finalAnswers.budget);

    const res = await fetch(`/api/style-finder?${params.toString()}`);
    const data = await res.json();
    setResults(data.products);
    setLoading(false);
  }

  function setAnswer(key: keyof Answers, value: string) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else findStyle(next);
  }

  function skip() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else findStyle(answers);
  }

  function reset() {
    setAnswers(EMPTY_ANSWERS);
    setResults(null);
    setStep(0);
  }

  return (
    <>
      <section className="relative overflow-hidden bg-ink py-8 text-paper sm:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage: "radial-gradient(rgba(216,195,154,0.35) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
            }}
          />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/25 blur-[100px]" />
          <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-gold-soft/15 blur-[110px]" />
        </div>
        <Container className="relative">
          <div className="mb-6 text-center">
            <p className="hp-accent-soft-text inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
              <Sparkles size={14} /> {eyebrow}
            </p>
            <h2 className="hp-heading mt-3 font-display text-3xl sm:text-4xl">{heading}</h2>
            <p className="hp-body mx-auto mt-3 max-w-lg text-sm text-paper/60">
              Answer a few questions — our stylists&apos; picks from the full collection, matched to you.
            </p>
          </div>

          {!results && (
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 flex items-center justify-center gap-1.5">
                {STEPS.map((s, i) => (
                  <span key={s} className={cn("h-0.5 w-10 rounded-full transition-colors duration-[var(--dur-1)]", i <= step ? "bg-gold" : "bg-paper/20")} />
                ))}
              </div>

              {step === 0 && (
                <StepGrid
                  label="What's the occasion?"
                  options={OCCASIONS.map((o) => ({ value: o, label: o }))}
                  onSelect={(v) => setAnswer("occasion", v)}
                  icons={OCCASION_ICONS}
                  gridClassName="grid-cols-3 sm:grid-cols-5"
                />
              )}
              {step === 1 && (
                <StepGrid
                  label="Shopping for"
                  options={GENDERS}
                  onSelect={(v) => setAnswer("gender", v)}
                  icons={GENDER_ICONS}
                  gridClassName="grid-cols-2 sm:grid-cols-4"
                />
              )}
              {step === 2 && (
                <StepGrid
                  label="Pick a style"
                  options={STYLES.map((s) => ({ value: s, label: s }))}
                  onSelect={(v) => setAnswer("style", v)}
                  icons={STYLE_ICONS}
                  gridClassName="grid-cols-2 sm:grid-cols-4"
                />
              )}
              {step === 3 && (
                <div>
                  <p className="mb-4 text-center text-sm uppercase tracking-[0.14em] text-paper/70">Favourite colour</p>
                  <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-5">
                    {COLOR_SWATCHES.map((c) => (
                      <button key={c.name} onClick={() => setAnswer("color", c.name)} className="group flex flex-col items-center gap-2">
                        <span
                          className="h-11 w-11 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35)] ring-1 ring-paper/30 transition-all duration-[var(--dur-1)] group-hover:scale-110 group-hover:ring-2 group-hover:ring-gold"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs text-paper/70 transition-colors duration-[var(--dur-1)] group-hover:text-gold-soft">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 4 && (
                <StepGrid
                  label="Your budget"
                  options={BUDGETS}
                  onSelect={(v) => setAnswer("budget", v)}
                  gridClassName="grid-cols-2 sm:grid-cols-4"
                />
              )}

              <div className="mt-6 flex items-center justify-center gap-6 text-xs uppercase tracking-[0.12em] text-paper/50">
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} className="hover:text-paper">
                    ← Back
                  </button>
                )}
                <button onClick={skip} className="hover:text-paper">
                  Skip
                </button>
              </div>

              {loading && <p className="mt-4 text-center text-sm text-paper/60">Finding your style...</p>}
            </div>
          )}
        </Container>
      </section>

      {results && (
        <section className="bg-paper py-12">
          <Container>
            <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-gold-deep">Your Edit</p>
                <h3 className="mt-1 font-display text-2xl">{results.length} pieces picked for you</h3>
              </div>
              <button onClick={reset} className="link-reveal text-xs uppercase tracking-[0.12em]">
                Start Over
              </button>
            </div>
            {results.length === 0 ? (
              <p className="text-center text-ink-soft">No matches yet — try a different combination.</p>
            ) : (
              <ScrollRail>
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} className="w-44 shrink-0 snap-start sm:w-52 lg:w-60" />
                ))}
              </ScrollRail>
            )}
          </Container>
        </section>
      )}
    </>
  );
}
