import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  badge?: number;
}

/** 44px-minimum icon button — every bare icon control in the app was
 * previously well under the WCAG 2.5.5 touch-target minimum. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, badge, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center text-ink transition-colors duration-[var(--dur-1)] hover:text-ink-mute disabled:opacity-30",
        className
      )}
      {...props}
    >
      {children}
      {typeof badge === "number" && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-[var(--radius-pill)] bg-ink px-1 text-[10px] font-medium leading-none text-paper"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  )
);
IconButton.displayName = "IconButton";
