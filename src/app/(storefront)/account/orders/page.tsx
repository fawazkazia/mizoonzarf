import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const session = await auth();
  const [orders, settings] = await Promise.all([
    db.order.findMany({ where: { userId: session!.user.id }, orderBy: { createdAt: "desc" }, include: { items: true } }),
    getSettings(),
  ]);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-ink-soft">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {orders.map((order) => (
            <li key={order.id} className="py-5">
              <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-ink-soft">
                    {order.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} — {order.items.length} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {settings.currencySymbol} {Number(order.total).toFixed(2)}
                  </span>
                  <Badge tone={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "sale" : "ink"}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
