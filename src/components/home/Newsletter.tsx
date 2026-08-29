"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { objectPositionClass, type ObjectPositionValue } from "@/lib/object-position";
import { cn } from "@/lib/utils";

export function NewsletterForm({ dark = false, placeholder = "Your email address" }: { dark?: boolean; placeholder?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("You're subscribed. Welcome to the list.");
      setEmail("");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className={cn("flex items-end gap-3 border-b", dark ? "border-paper/30" : "border-ink/30")}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent py-2.5 text-sm outline-none",
            dark ? "text-paper placeholder:text-paper/40" : "text-ink placeholder:text-ink-soft/50"
          )}
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Subscribe"
          className={cn("mb-2 flex h-8 w-8 shrink-0 items-center justify-center transition-transform duration-[var(--dur-1)] hover:translate-x-0.5", dark ? "text-paper" : "text-ink")}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}

export function NewsletterSection({
  heading = "Join the List",
  subtitle = "Exclusive drops. No spam. Unsubscribe anytime.",
  placeholder = "Your email address",
  imageUrl,
  objectPosition,
}: {
  heading?: string;
  subtitle?: string;
  placeholder?: string;
  imageUrl?: string | null;
  objectPosition?: ObjectPositionValue | null;
}) {
  return (
    <section className="grid bg-ink text-paper lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Img
          src={imageUrl}
          alt=""
          seedFallback="newsletter-banner"
          className={cn("absolute inset-0", objectPositionClass(objectPosition))}
        />
      </div>
      <Container className="flex flex-col items-center justify-center gap-5 py-16 text-center sm:py-20 lg:items-start lg:px-16 lg:py-24 lg:text-left">
        <h2 className="hp-heading font-display text-3xl sm:text-4xl">{heading}</h2>
        <p className="hp-body max-w-md text-paper/70">{subtitle}</p>
        <div className="w-full max-w-md">
          <NewsletterForm dark placeholder={placeholder} />
        </div>
      </Container>
    </section>
  );
}
