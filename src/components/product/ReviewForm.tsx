"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, isSignedIn }: { productId: string; isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isSignedIn) {
    return (
      <p className="text-sm text-ink-soft">
        <Link href="/login" className="underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, comment }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't submit your review.");
      return;
    }
    toast.success("Thanks for your review!");
    setTitle("");
    setComment("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-6 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-xl">Write a Review</span>
        <ChevronDown size={18} className={cn("transition-transform duration-[var(--dur-1)]", open && "rotate-180")} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-line p-6">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`}>
                <Star size={22} className={star <= rating ? "fill-gold text-gold" : "text-ink-soft/30"} />
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="border border-line px-3 py-2 text-sm"
          />
          <textarea
            required
            minLength={10}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            className="border border-line px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={loading} className="self-start">
            Submit Review
          </Button>
        </form>
      )}
    </div>
  );
}
