"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/data/products";

function useCountdown(endDate: string) {
  // Starts null (not Date.now()-derived) to avoid a render-time/SSR
  // hydration mismatch; the first real value is computed in the effect.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(new Date(endDate).getTime() - Date.now(), 0));
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (remaining === null) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: false, ready: false };

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);
  return { days, hours, minutes, seconds, ended: remaining <= 0, ready: true };
}

export function FlashSaleCountdown({
  name,
  endDate,
  discountLabel,
  discountValue,
  discountType,
  products,
  variant = "default",
}: {
  name: string;
  endDate: string;
  discountLabel: string;
  discountValue?: number;
  discountType?: string;
  products: ProductCardData[];
  variant?: "default" | "compact";
}) {
  const { days, hours, minutes, seconds, ended, ready } = useCountdown(endDate);
  if ((ready && ended) || products.length === 0) return null;

  const units = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];

  const discountStat = discountType === "PERCENTAGE" && discountValue ? `Up to ${discountValue}% Off` : null;

  return (
    <section className="bg-ink text-paper">
      <Container className={variant === "compact" ? "py-10" : "py-16 sm:py-20"}>
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sale">{discountLabel}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">{name}</h2>
            {discountStat && <p className="mt-2 font-display text-2xl text-gold-soft">{discountStat}</p>}
          </div>
          <div className="flex gap-3" role="timer" aria-live="off">
            {units.map((u) => (
              <div key={u.label} className="flex h-16 w-16 flex-col items-center justify-center border border-paper/20">
                <span className="font-display text-xl leading-none tabular-nums">{String(u.value).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-wider text-paper/60">{u.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {variant === "default" && (
        <div className="bg-paper py-10 sm:py-12">
          <Container>
            <ScrollRail>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} className="w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-[23%]" />
              ))}
            </ScrollRail>
          </Container>
        </div>
      )}

      <Container className="flex justify-center py-10">
        <ButtonLink href="/sale" className="!bg-paper !text-ink hover:!bg-gold hover:!text-paper">
          Shop the Sale
        </ButtonLink>
      </Container>
    </section>
  );
}
