"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountSidebarNav } from "./AccountSidebarNav";
import { SignOutButton } from "./SignOutButton";

/** Full sidebar on desktop; collapses to a tap-to-expand drawer on mobile so the
 * nav list doesn't push the actual page content below the fold. */
export function AccountSidebar({
  name,
  email,
  initials,
  accent,
  unreadCount,
}: {
  name: string;
  email: string;
  initials: string;
  accent: string;
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="rounded-2xl border border-line bg-paper-raise p-5 shadow-[var(--shadow-lift)] lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 text-left lg:flex-col lg:items-center lg:gap-3 lg:border-b lg:border-line lg:pb-5 lg:text-center"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg lg:h-16 lg:w-16 lg:text-xl"
          style={{ backgroundColor: `${accent}1a`, color: accent, border: `1px solid ${accent}33` }}
        >
          {initials}
        </span>
        <span className="min-w-0 flex-1 lg:flex-none">
          <span className="block truncate font-display text-base lg:text-lg">{name}</span>
          <span className="block truncate text-xs text-ink-soft">{email}</span>
        </span>
        <ChevronDown size={18} className={cn("shrink-0 text-ink-soft transition-transform duration-[var(--dur-1)] lg:hidden", open && "rotate-180")} />
      </button>

      <div className={cn("border-t border-line lg:block lg:border-t-0", open ? "mt-4 block pt-1" : "hidden")}>
        <AccountSidebarNav unreadCount={unreadCount} accent={accent} />
        <div className="mt-3 border-t border-line pt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
