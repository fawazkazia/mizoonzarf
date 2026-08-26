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
