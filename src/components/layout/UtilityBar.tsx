"use client";

import { useEffect, useState } from "react";

interface UtilityBarProps {
  promoMessages: string[];
  supportPhone: string;
  countryLabel: string;
  countryFlag: string;
  freeShippingMessage: string;
  showFreeShipping: boolean;
}

/** Rotating promo/support/country strip. A working country/currency picker
 * is deliberately out of scope — there's one global currency and one price
 * per product, so a dropdown that changes nothing would be worse than no
 * dropdown; this renders as a static, non-interactive label instead. */
export function UtilityBar({
  promoMessages,
  supportPhone,
  countryLabel,
  countryFlag,
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
      <span className="hidden truncate sm:block sm:justify-self-start">Support: {supportPhone}</span>
      <span key={safeIndex} className="animate-fade-in truncate text-center sm:justify-self-center">
        {messages[safeIndex]}
      </span>
      <span className="hidden truncate sm:flex sm:items-center sm:justify-self-end sm:gap-1.5">
        <span aria-hidden="true">{countryFlag}</span> {countryLabel.split(" ")[0]}
      </span>
    </div>
  );
}
