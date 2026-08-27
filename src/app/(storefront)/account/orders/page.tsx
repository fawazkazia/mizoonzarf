import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "My Orders" };

/** COD is never "paid" ahead of delivery by design, so a PENDING COD order is the
 * normal happy path — only a prepaid method sitting at PENDING actually needs action. */
function statusBadge(order: { status: string; paymentStatus: string; paymentMethod: string }): { label: string; tone: "ink" | "sale" | "success" | "gold" } {
  if (order.paymentStatus === "FAILED") return { label: "Payment Failed", tone: "sale" };
  if (order.paymentStatus === "PENDING" && order.paymentMethod !== "COD") return { label: "Pending Payment", tone: "gold" };
  if (order.status === "DELIVERED") return { label: "Delivered", tone: "success" };
  if (order.status === "CANCELLED") return { label: "Cancelled", tone: "sale" };
  return { label: order.status.replace(/_/g, " "), tone: "ink" };
}

export default async function OrdersPage() {
  const session = await auth();
  const orders = await db.order.findMany({ where: { userId: session!.user.id }, orderBy: { createdAt: "desc" }, include: { items: true } });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-ink-soft">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {orders.map((order) => {
            const badge = statusBadge(order);
            return (
              <li key={order.id} className="py-5">
                <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-ink-soft">
                      {order.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} — {order.items.length} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatINR(Number(order.total))}</span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
