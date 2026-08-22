import { cn } from "@/lib/utils";

export function Container({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10", className)} {...rest}>
      {children}
    </div>
  );
}
