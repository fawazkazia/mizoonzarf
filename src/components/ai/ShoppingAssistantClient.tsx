"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowUp, ArrowUpRight, X, Gem, Shirt, Gift, ShoppingBag } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { Img } from "@/components/ui/ArtImage";
import { Price, discountPercent } from "@/components/ui/Price";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { useCartStore } from "@/stores/cart-store";
import { useQuickViewStore } from "@/stores/quick-view-store";
import { useHeroVisibilityStore } from "@/stores/hero-visibility-store";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: ProductCardData[];
}

const STARTERS = [
  { icon: Gem, text: "I need an outfit for a wedding under AED 500" },
  { icon: Shirt, text: "Suggest a black shirt with matching trousers" },
  { icon: Gift, text: "A gift for my wife under AED 300" },
];

/** The concierge's AI mark — a gold orb with a soft breathing glow, reused at
 * every size (header, message avatar, welcome hero) so the assistant reads as
 * one consistent presence throughout the panel. */
function AIOrb({ size = "sm" }: { size?: "sm" | "lg" }) {
  const wrap = size === "lg" ? "h-14 w-14" : "h-8 w-8";
  const icon = size === "lg" ? 22 : 14;

  return (
    <div className={cn("relative shrink-0", wrap)}>
      <div className="absolute inset-0 animate-pulse rounded-full bg-gold/40 blur-md [animation-duration:2.4s]" />
      {size === "lg" && (
        <div
          className="absolute -inset-1 animate-spin rounded-full opacity-70 [animation-duration:7s]"
          style={{ background: "conic-gradient(from 0deg, transparent 0%, var(--color-gold-soft) 12%, transparent 26%)" }}
        />
      )}
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep shadow-[0_0_0_3px_var(--color-ink)]">
        <Sparkles size={icon} className="text-paper" />
      </div>
    </div>
  );
}

function AIThinking() {
  return (
    <div className="flex animate-fade-up items-end gap-2.5">
      <AIOrb />
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
        <span className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <Sparkles
              key={i}
              size={10}
              className="animate-pulse text-gold"
              style={{ animationDelay: `${i * 220}ms`, animationDuration: "1200ms" }}
            />
          ))}
        </span>
        <span className="text-xs text-paper/60">Finding the best styles for you…</span>
      </div>
    </div>
  );
}

function AIProductCard({ product }: { product: ProductCardData }) {
  const addItem = useCartStore((s) => s.addItem);
  const openQuickView = useQuickViewStore((s) => s.open);
  const display = useDisplayPrice(product.price, product.compareAtPrice);
  const off = discountPercent(product.price, product.compareAtPrice);
  const singleVariant = product.variantCount <= 1 && product.defaultVariantId;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!product.inStock) return;
    if (singleVariant && product.defaultVariantId) addItem(product.defaultVariantId, 1, true);
    else openQuickView(product.slug);
  }

  return (
    <div className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-line/30 bg-paper-raise shadow-[0_12px_32px_-16px_rgba(0,0,0,0.5)] transition-all duration-[var(--dur-2)] hover:-translate-y-0.5 hover:border-gold-soft hover:shadow-[0_16px_36px_-14px_rgba(169,128,63,0.4)]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] bg-paper-dim">
        <Img src={product.image} alt={product.name} seedFallback={product.id} />
        {off && (
          <Badge tone="sale" className="absolute left-2 top-2">
            -{off}%
          </Badge>
        )}
        {!product.inStock && (
          <Badge tone="outline" className="absolute left-2 top-2 bg-paper">
            Sold Out
          </Badge>
        )}
      </Link>
      <div className="flex flex-col gap-1 p-3">
        {product.brand && <p className="truncate text-[10px] uppercase tracking-[0.08em] text-ink-soft/70">{product.brand}</p>}
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-xs leading-snug text-ink">
          {product.name}
        </Link>
        <span className="inline-flex items-center gap-1">
          {display.isConverted && <span className="text-[11px] text-ink-soft/60">≈</span>}
          <Price price={display.price} compareAt={display.compareAt} currency={display.symbol} size="sm" />
        </span>
        {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} size={10} />}

        <div className="mt-1.5 flex items-center gap-1.5">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 rounded-full border border-line py-1.5 text-center text-[10px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            View
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            aria-label="Add to bag"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-transform hover:scale-105 disabled:opacity-30"
          >
            <ShoppingBag size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShoppingAssistantClient({ configured }: { configured: boolean }) {
  const pathname = usePathname();
  const heroInView = useHeroVisibilityStore((s) => s.heroInView);
  // The floating launcher sits over form fields on small checkout screens (address/payment
  // sections run the full width there) — hidden below lg on checkout only; desktop unaffected.
  // Also ducks out while the homepage Hero's bottom-anchored slide text is on screen, since
  // on short mobile viewports that text sits in the same band as this button.
  const hideOnMobile = pathname?.startsWith("/checkout") || heroInView;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, products: data.products }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => configured && setOpen(true)}
        disabled={!configured}
        aria-label={configured ? "Help Me Choose — AI shopping assistant" : "AI shopping assistant — coming soon"}
        className={cn(
          "fixed bottom-[calc(var(--bottom-nav-h)+5.5rem+env(safe-area-inset-bottom))] right-4 z-[var(--z-fab)] flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-br from-ink to-[#2a2820] px-3 text-paper shadow-lg transition-transform duration-[var(--dur-1)] lg:bottom-24",
          configured ? "hover:scale-105" : "cursor-not-allowed opacity-50",
          hideOnMobile && "max-lg:hidden"
        )}
      >
        <Sparkles size={14} className="text-gold" />
        <span className="text-[10px] uppercase tracking-[0.1em]">{configured ? "Help Me Choose" : "Coming Soon"}</span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} side="right" ariaLabel="AI Shopping Assistant" panelClassName="max-w-sm">
        <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-ink via-[#1c1a14] to-[#0e0d0a]">
          {/* Ambient AI backdrop — warm gold glow spanning the full panel; a dark
             charcoal surface so the concierge reads as an unmistakably distinct,
             premium layer over the light storefront underneath. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gold/25 blur-[100px]" />
            <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold-soft/20 blur-[110px]" />
            <div className="absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-gold-deep/25 blur-[110px]" />
            <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-gold/10 blur-[100px]" />
          </div>

          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] bg-black/20 px-5 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AIOrb />
              <div>
                <p className="font-display text-lg leading-tight text-paper">Style Concierge</p>
                <p className="flex items-center gap-1.5 text-[11px] text-paper/55">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60 [animation-duration:1.8s]" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  Online now
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-paper/60 transition-colors duration-[var(--dur-1)] hover:bg-white/10 hover:text-paper"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/[0.06] bg-white/[0.03] px-6 py-6 text-center backdrop-blur-sm">
                  <AIOrb size="lg" />
                  <div className="space-y-1.5">
                    <p className="font-display text-xl text-paper">Hi, I&apos;m your Style Concierge</p>
                    <p className="mx-auto max-w-[26ch] text-sm text-paper/60">
                      Tell me the occasion, budget, or vibe — I&apos;ll find the perfect pieces from our collection.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {STARTERS.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => send(text)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left backdrop-blur-sm transition-all duration-[var(--dur-2)] hover:-translate-y-0.5 hover:border-gold hover:bg-white/[0.07] hover:shadow-[0_10px_28px_-16px_rgba(169,128,63,0.6)]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold transition-colors group-hover:bg-gold/25">
                        <Icon size={15} />
                      </span>
                      <span className="flex-1 text-xs text-paper/70 group-hover:text-paper">{text}</span>
                      <ArrowUpRight
                        size={14}
                        className="shrink-0 text-paper/25 transition-all duration-[var(--dur-2)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex animate-fade-up flex-col gap-2", m.role === "user" && "items-end")}>
                  <div className={cn("flex items-end gap-2", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {m.role === "assistant" && <AIOrb />}
                    <div
                      className={cn(
                        "max-w-[80%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed",
                        m.role === "user"
                          ? "rounded-2xl rounded-br-md bg-paper text-ink"
                          : "rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.04] text-paper/90 backdrop-blur-sm"
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                  {m.products && m.products.length > 0 && (
                    <div className="w-full pl-10">
                      <ScrollRail showArrows={false} trackClassName="pb-1">
                        {m.products.map((p) => (
                          <AIProductCard key={p.id} product={p} />
                        ))}
                      </ScrollRail>
                    </div>
                  )}
                </div>
              ))}
              {loading && <AIThinking />}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="relative z-10 border-t border-white/[0.06] bg-black/20 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-md"
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border bg-white/[0.05] py-1.5 pl-1.5 pr-2 transition-all duration-[var(--dur-1)]",
                inputFocused ? "border-gold shadow-[0_0_0_3px_rgba(169,128,63,0.2)]" : "border-white/[0.08]"
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gold">
                <Sparkles size={15} />
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask about outfits, gifts, occasions…"
                className="flex-1 bg-transparent text-sm text-paper placeholder:text-paper/40"
                style={{ outline: "none" }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-ink transition-all duration-[var(--dur-1)] hover:scale-105 disabled:scale-100 disabled:opacity-30"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </form>
        </div>
      </Sheet>
    </>
  );
}
