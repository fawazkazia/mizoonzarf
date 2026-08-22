import { cn } from "@/lib/utils";
import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans uppercase tracking-[0.12em] transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "bg-paper text-ink border border-ink hover:bg-ink hover:text-paper",
  outline: "bg-transparent text-current border border-current/40 hover:border-current",
  ghost: "bg-transparent text-ink hover:bg-paper-dim",
  link: "bg-transparent underline underline-offset-4 decoration-1 p-0 tracking-normal normal-case",
};

const sizes: Record<Size, string> = {
  sm: "text-[11px] px-4 py-2",
  md: "text-xs px-6 py-3.5",
  lg: "text-sm px-8 py-4.5",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], size !== undefined && sizes[size], className)} {...props} />
  )
);
Button.displayName = "Button";

interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function ButtonLink({ className, variant = "primary", size = "md", ...props }: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
