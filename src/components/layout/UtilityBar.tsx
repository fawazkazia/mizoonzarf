"use client";

import { useEffect, useState } from "react";
import { CountrySwitcher } from "@/components/layout/CountrySwitcher";

interface UtilityBarProps {
  promoMessages: string[];
  supportPhone: string;
  freeShippingMessage: string;
  showFreeShipping: boolean;
}

/** Rotating promo/support/country strip. The store only ships/prices for one
 * region, but shoppers can preview prices (and see the matching flag) in
 * another country's currency — display-only, see CountrySwitcher and
 * useDisplayPrice. */
export function UtilityBar({
  promoMessages,
  supportPhone,
  freeShippingMessage,
  showFreeShipping,
}: UtilityBarProps) {
  const messages = showFreeShipping ? [freeShippingMessage, ...promoMessages] : promoMessages;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  if (messages.length === 0) return null;
  const safeIndex = index % messages.length;

  return (
    <div className="flex h-full items-center justify-center px-4 text-[10.5px] uppercase tracking-[0.18em] sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-6 lg:px-10">
      <span className="hidden truncate sm:block sm:justify-self-start">
        Support: <a href={`tel:${supportPhone.replace(/\s+/g, "")}`}>{supportPhone}</a>
      </span>
      <span key={safeIndex} className="animate-fade-in truncate text-center sm:justify-self-center">
        {messages[safeIndex]}
      </span>
      <span className="hidden items-center truncate sm:flex sm:justify-self-end">
        <CountrySwitcher />
      </span>
    </div>
  );
}
