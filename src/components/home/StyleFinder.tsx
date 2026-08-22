"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/utils";

const OCCASIONS = ["wedding", "office", "casual", "evening", "resort"];
const GENDERS = [
  { value: "any", label: "Any" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Kids" },
];
const STYLES = ["classic", "minimal", "bold", "romantic"];
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
}: {
  label: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-5 text-center text-sm uppercase tracking-[0.14em] text-paper/70">{label}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="aspect-[4/3] border border-paper/20 text-sm capitalize transition-colors duration-[var(--dur-1)] hover:border-gold hover:bg-gold hover:text-ink"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Presentation-only restyle: same untouched /api/style-finder rule-based
 * filter, now a stepped one-question-at-a-time flow instead of five stacked
 * pill groups. Framed as "our stylists' picks" rather than implying AI,
 * since this is a plain filter, not a generative call. */
export function StyleFinder() {
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
      <section className="bg-ink py-20 text-paper">
        <Container>
          <div className="mb-10 text-center">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-soft">
              <Sparkles size={14} /> Style Finder
            </p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Find Your Style</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-paper/60">
              Answer a few questions — our stylists&apos; picks from the full collection, matched to you.
            </p>
          </div>

          {!results && (
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 flex items-center justify-center gap-1.5">
                {STEPS.map((s, i) => (
                  <span key={s} className={cn("h-0.5 w-10 rounded-full transition-colors duration-[var(--dur-1)]", i <= step ? "bg-gold" : "bg-paper/20")} />
                ))}
              </div>

              {step === 0 && <StepGrid label="What's the occasion?" options={OCCASIONS.map((o) => ({ value: o, label: o }))} onSelect={(v) => setAnswer("occasion", v)} />}
              {step === 1 && <StepGrid label="Shopping for" options={GENDERS} onSelect={(v) => setAnswer("gender", v)} />}
              {step === 2 && <StepGrid label="Pick a style" options={STYLES.map((s) => ({ value: s, label: s }))} onSelect={(v) => setAnswer("style", v)} />}
              {step === 3 && (
                <div>
                  <p className="mb-5 text-center text-sm uppercase tracking-[0.14em] text-paper/70">Favourite colour</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {COLOR_SWATCHES.map((c) => (
                      <button key={c.name} onClick={() => setAnswer("color", c.name)} className="flex flex-col items-center gap-2">
                        <span
                          className="h-12 w-12 rounded-full ring-1 ring-paper/30 transition-transform duration-[var(--dur-1)] hover:scale-105"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs text-paper/70">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 4 && <StepGrid label="Your budget" options={BUDGETS} onSelect={(v) => setAnswer("budget", v)} />}

              <div className="mt-10 flex items-center justify-center gap-6 text-xs uppercase tracking-[0.12em] text-paper/50">
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} className="hover:text-paper">
                    ← Back
                  </button>
                )}
                <button onClick={skip} className="hover:text-paper">
                  Skip
                </button>
              </div>

              {loading && <p className="mt-6 text-center text-sm text-paper/60">Finding your style...</p>}
            </div>
          )}
        </Container>
      </section>

      {results && (
        <section className="bg-paper py-16">
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
                  <ProductCard key={p.id} product={p} className="w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-[23%]" />
                ))}
              </ScrollRail>
            )}
          </Container>
        </section>
      )}
    </>
  );
}
