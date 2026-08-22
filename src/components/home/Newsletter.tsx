"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { cn } from "@/lib/utils";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
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
          placeholder="Your email address"
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

export function NewsletterSection() {
  return (
    <section className="grid bg-ink text-paper lg:grid-cols-2">
      <div className="hidden lg:block">
        <Img src={null} alt="" seedFallback="newsletter-banner" className="h-full" />
      </div>
      <Container className="flex flex-col items-center justify-center gap-5 py-20 text-center lg:items-start lg:px-16 lg:text-left">
        <h2 className="font-display text-4xl sm:text-5xl">Join the List</h2>
        <p className="max-w-md text-paper/70">Exclusive drops. No spam. Unsubscribe anytime.</p>
        <div className="w-full max-w-md">
          <NewsletterForm dark />
        </div>
      </Container>
    </section>
  );
}
