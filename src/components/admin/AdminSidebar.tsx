"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV as ALL_NAV } from "./nav";
import { allowedRolesForPath } from "@/lib/admin-permissions";

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const NAV = ALL_NAV.filter((item) => {
    const allowed = allowedRolesForPath(item.href);
    return !allowed || allowed.includes(role as never);
  });

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-paper print:hidden lg:flex">
      <div className="border-b border-line px-6 py-5">
        <Link href="/admin" className="font-display text-xl">
          Admin
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((item, i) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const showHeader = item.section && item.section !== NAV[i - 1]?.section;
            return (
              <li key={`${item.section ?? ""}-${item.href}`}>
                {showHeader && (
                  <p className="mb-1 mt-4 px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft/70 first:mt-1">{item.section}</p>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                    active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim hover:text-ink"
                  )}
                >
                  <item.icon size={16} strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line px-6 py-4">
        <Link href="/" className="text-xs text-ink-soft underline">
          ← Back to storefront
        </Link>
      </div>
    </aside>
  );
}
