import { cn } from "@/lib/utils";

export function Price({
  price,
  compareAt,
  currency = "AED",
  size = "md",
  className,
}: {
  price: number;
  compareAt?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const onSale = compareAt && compareAt > price;
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" };

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-medium tracking-tight", sizes[size], onSale && "text-sale")}>
        {currency} {price.toFixed(2)}
      </span>
      {onSale && (
        <span className="text-ink-soft/60 line-through text-xs">
          {currency} {compareAt!.toFixed(2)}
        </span>
      )}
    </span>
  );
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
