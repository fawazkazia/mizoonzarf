import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Returns" };

const STATUS_TONE: Record<string, "ink" | "sale" | "success" | "outline"> = {
  REQUESTED: "ink",
  APPROVED: "ink",
  REJECTED: "sale",
  PICKUP: "ink",
  RECEIVED: "ink",
  REFUND_PROCESSING: "ink",
  REFUNDED: "success",
};

export default async function ReturnsPage() {
  const session = await auth();
  const returns = await db.return.findMany({
    where: { order: { userId: session!.user.id } },
    orderBy: { createdAt: "desc" },
    include: { orderItem: true, order: { select: { orderNumber: true } } },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Returns</h1>
      {returns.length === 0 ? (
        <p className="text-ink-soft">
          You haven&apos;t requested any returns. You can request one from a delivered order&apos;s detail page.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {returns.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-5">
              <div>
                <p className="font-medium">{r.orderItem?.productName ?? "Item"}</p>
                <p className="text-xs text-ink-soft">
                  Order {r.order.orderNumber} — {r.reason} — {r.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
                {r.adminNote && <p className="mt-1 text-xs text-ink-soft italic">&ldquo;{r.adminNote}&rdquo;</p>}
              </div>
              <div className="flex items-center gap-3">
                {r.refundAmount != null && <span className="text-sm font-medium">{formatINR(Number(r.refundAmount))}</span>}
                <Badge tone={STATUS_TONE[r.status] ?? "ink"}>{r.status.replace(/_/g, " ")}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
