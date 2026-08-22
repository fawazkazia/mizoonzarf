import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";

export interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

export function ReviewList({
  reviews,
  avgRating,
  reviewCount,
}: {
  reviews: ReviewItem[];
  avgRating: number;
  reviewCount: number;
}) {
  const histogram = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  const maxCount = Math.max(...histogram.map((h) => h.count), 1);

  return (
    <div>
      {reviewCount > 0 && (
        <div className="mb-8 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-center sm:gap-10">
          <div className="shrink-0 text-center sm:text-left">
            <p className="font-display text-5xl">{avgRating.toFixed(1)}</p>
            <Rating value={avgRating} size={14} />
            <p className="mt-1 text-xs text-ink-soft">{reviewCount} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {histogram.map((h) => (
              <div key={h.star} className="flex items-center gap-2 text-xs text-ink-soft">
                <span className="w-3">{h.star}</span>
                <div className="h-1.5 flex-1 bg-line">
                  <div className="h-full bg-gold" style={{ width: `${(h.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-5 text-right">{h.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-ink-soft">No reviews yet — be the first to share your thoughts.</p>
      ) : (
        <ul className="flex flex-col gap-8">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-line pb-8 last:border-0">
              <div className="flex items-center gap-3">
                <Rating value={r.rating} />
                {r.isVerifiedPurchase && <Badge tone="outline">Verified Purchase</Badge>}
              </div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>
              <p className="mt-2 text-xs text-ink-soft/60">
                {r.customerName} — {r.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
