/**
 * Formats an amount as Indian Rupees with native lakh/crore digit grouping
 * (e.g. ₹1,25,000) via the en-IN locale — no manual grouping logic needed.
 * Whole-number prices render without decimals (₹999), matching how Indian
 * storefronts display MRP; fractional amounts still show paise.
 */
export function formatINR(amount: number): string {
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Builds the running-banner message list from settings — shared by
 * HeaderRunningBanner (site-wide chrome) and the homepage's own
 * `runningBanner` section so they never drift out of sync. Lives here
 * (not settings.ts) because settings.ts imports the Prisma client and
 * this needs to be safe to call from a "use client" component.
 */
export function buildHeaderPromoMessages(settings: {
  header: { showFreeShipping: boolean; promoMessages: string[] };
  shipping: { freeShippingThreshold: number };
}): string[] {
  return settings.header.showFreeShipping
    ? [`Free shipping on orders over ${formatINR(settings.shipping.freeShippingThreshold)}`, ...settings.header.promoMessages]
    : settings.header.promoMessages;
}
