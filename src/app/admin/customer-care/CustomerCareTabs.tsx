"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/customer-care", label: "Dashboard", exact: true },
  { href: "/admin/customer-care/tickets", label: "Tickets", exact: false },
  { href: "/admin/customers", label: "Customers", exact: false },
  { href: "/admin/returns", label: "Returns", exact: false },
  { href: "/admin/customer-care/refunds", label: "Refunds", exact: false },
  { href: "/admin/orders?status=CANCELLED", label: "Cancellations", exact: false },
  { href: "/admin/customer-care/reports", label: "Reports", exact: false },
];

/** Dedicated in-section navigation for Customer Care — entered via the topbar button, not the
 * main sidebar (spec: "keep everything accessible from the main Customer Care section" without
 * cluttering the general admin nav with 7 more entries). */
export function CustomerCareTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-line">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors",
              active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
