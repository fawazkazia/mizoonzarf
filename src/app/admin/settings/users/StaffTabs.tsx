"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/settings/users", label: "Staff", exact: true },
  { href: "/admin/settings/users/roles", label: "Roles & Permissions", exact: false },
  { href: "/admin/settings/users/audit-log", label: "Audit Log", exact: false },
];

export function StaffTabs() {
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
