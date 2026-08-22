import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({ value, count, size = 14, className }: { value: number; count?: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.5}
            className={i < Math.round(value) ? "fill-gold text-gold" : "fill-transparent text-ink-soft/30"}
          />
        ))}
      </span>
      {typeof count === "number" && <span className="text-xs text-ink-soft/70">({count})</span>}
    </span>
  );
}
