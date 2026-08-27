"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, RotateCcw, Heart, MapPin, Gift, Bell, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/returns", label: "Returns", icon: RotateCcw },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/loyalty", label: "Loyalty Points", icon: Gift },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

const COMING_SOON: { label: string; icon: LucideIcon }[] = [{ label: "Referrals", icon: Users }];

export function AccountSidebarNav({ unreadCount, accent }: { unreadCount: number; accent: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 py-4">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-[var(--dur-1)]",
              active ? "font-medium text-ink" : "text-ink-soft hover:bg-paper-dim hover:text-ink"
            )}
            style={active ? { backgroundColor: `${accent}14` } : undefined}
          >
            <Icon size={17} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/account/notifications" && unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] text-paper">{unreadCount}</span>
            )}
          </Link>
        );
      })}
      {COMING_SOON.map((item) => {
        const Icon = item.icon;
        return (
          <span key={item.label} className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink-soft/40">
            <Icon size={17} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            <span className="text-[10px] uppercase">Soon</span>
          </span>
        );
      })}
    </nav>
  );
}
