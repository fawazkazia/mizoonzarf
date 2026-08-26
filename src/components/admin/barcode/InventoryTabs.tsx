"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/inventory", label: "Dashboard", exact: true },
  { href: "/admin/inventory/barcodes", label: "Barcodes", exact: false },
  { href: "/admin/inventory/scan", label: "Scan", exact: false },
  { href: "/admin/inventory/receive", label: "Receive Stock", exact: false },
  { href: "/admin/inventory/movements", label: "Movements", exact: false },
  { href: "/admin/inventory/warehouses", label: "Warehouses", exact: false },
];

export function InventoryTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-line">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2 text-xs uppercase tracking-wide transition-colors",
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
