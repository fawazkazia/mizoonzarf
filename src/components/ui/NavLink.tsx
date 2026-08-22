"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type LinkProps = React.ComponentProps<typeof Link>;

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  exact?: boolean;
}

/** Link with the shared `.link-reveal` hover underline plus centralized
 * active-path detection (prefix match by default) — replaces several
 * independent, inconsistent "is this the current page" checks. */
export function NavLink({ href, className, activeClassName, exact = false, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const hrefPath = typeof href === "string" ? href.split("?")[0] : (href.pathname ?? "");
  const isActive = exact
    ? pathname === hrefPath
    : pathname === hrefPath || (hrefPath !== "/" && pathname.startsWith(`${hrefPath}/`));

  return (
    <Link
      href={href}
      className={cn("link-reveal", className, isActive && activeClassName)}
      data-active={isActive || undefined}
      aria-current={isActive ? "page" : undefined}
      {...props}
    />
  );
}
