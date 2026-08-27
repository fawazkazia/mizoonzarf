import { cn } from "@/lib/utils";

type Tone = "ink" | "sale" | "success" | "gold" | "outline" | "warning";

const tones: Record<Tone, string> = {
  ink: "bg-ink text-paper",
  sale: "bg-sale text-paper",
  success: "bg-success text-paper",
  gold: "bg-gold text-paper",
  outline: "border border-ink/30 text-ink",
  warning: "bg-orange-500 text-paper",
};

export function Badge({ tone = "ink", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
