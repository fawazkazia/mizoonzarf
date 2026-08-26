"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useHeroVisibilityStore } from "@/stores/hero-visibility-store";
import { cn } from "@/lib/utils";

export function WhatsAppButtonClient({ href }: { href: string }) {
  const pathname = usePathname();
  const heroInView = useHeroVisibilityStore((s) => s.heroInView);
  // Same reasoning as ShoppingAssistantClient — floating launcher overlaps checkout's
  // full-width form fields on small screens; hidden below lg on checkout only.
  // Also ducks out while the homepage Hero's bottom-anchored slide text is on
  // screen, since on short mobile viewports that text sits in the same band.
  const hideOnMobile = pathname?.startsWith("/checkout") || heroInView;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        "group fixed bottom-[calc(var(--bottom-nav-h)+1rem+env(safe-area-inset-bottom))] right-4 z-[var(--z-fab)] flex h-10 w-10 items-center justify-center rounded-full bg-success text-paper shadow-lg transition-transform duration-[var(--dur-1)] hover:scale-105 lg:bottom-6",
        hideOnMobile && "max-lg:hidden"
      )}
    >
      <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-xs text-paper opacity-0 shadow-md transition-opacity duration-[var(--dur-1)] group-hover:opacity-100">
        WhatsApp
      </span>
      <MessageCircle size={18} fill="currentColor" className="text-paper" strokeWidth={0} />
    </a>
  );
}
