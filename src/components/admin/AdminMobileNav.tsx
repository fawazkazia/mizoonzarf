"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV as ALL_NAV } from "./nav";
import { allowedRolesForPath } from "@/lib/admin-permissions";

export function AdminMobileNav({ open, onClose, role }: { open: boolean; onClose: () => void; role: string }) {
  const pathname = usePathname();
  const ADMIN_NAV = ALL_NAV.filter((item) => {
    const allowed = allowedRolesForPath(item.href);
    return !allowed || allowed.includes(role as never);
  });

  return (
    <>
      <div
        className={cn("fixed inset-0 z-50 bg-ink/40 transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-64 flex-col bg-paper transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <span className="font-display text-xl">Admin</span>
          <button onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {ADMIN_NAV.map((item, i) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const showHeader = item.section && item.section !== ADMIN_NAV[i - 1]?.section;
              return (
                <li key={`${item.section ?? ""}-${item.href}`}>
                  {showHeader && (
                    <p className="mb-1 mt-4 px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft/70 first:mt-1">{item.section}</p>
                  )}
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2 text-sm",
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
      </aside>
    </>
  );
}
