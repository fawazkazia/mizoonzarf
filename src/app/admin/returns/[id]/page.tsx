import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { ReturnStatusUpdater } from "../ReturnStatusUpdater";

export const metadata = { title: "Return Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReturnDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ret = await db.return.findUnique({
    where: { id },
    include: {
      order: { include: { user: { select: { id: true, name: true, email: true } } } },
      orderItem: true,
    },
  });

  if (!ret) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Return Request</h1>
        <p className="text-sm text-ink-soft">
          Order{" "}
          <Link href={`/admin/orders/${ret.order.id}`} className="underline">
            {ret.order.orderNumber}
          </Link>{" "}
          — requested {ret.createdAt.toLocaleString()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="border border-line p-5">
            <h2 className="mb-4 font-display text-lg">Item</h2>
            <p className="text-sm">
              {ret.orderItem?.productName} {ret.orderItem?.variantLabel && `(${ret.orderItem.variantLabel})`}
            </p>
            <p className="mt-1 text-sm text-ink-soft">Original line total: {ret.orderItem ? formatINR(Number(ret.orderItem.subtotal)) : "—"}</p>
          </div>

          <div className="border border-line p-5">
            <h2 className="mb-4 font-display text-lg">Reason</h2>
            <p className="text-sm">{ret.reason}</p>
            {ret.description && <p className="mt-2 text-sm text-ink-soft">{ret.description}</p>}
          </div>

          <div className="border border-line p-5">
            <h2 className="mb-4 font-display text-lg">Customer</h2>
            <p className="text-sm">
              {ret.order.user ? (
                <Link href={`/admin/customers/${ret.order.user.id}`} className="hover:underline">
                  {ret.order.user.name} ({ret.order.user.email})
                </Link>
              ) : (
                <>Guest — {ret.order.guestEmail}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-line p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Current Status</p>
            <div className="mt-2">
              <Badge tone={ret.status === "REFUNDED" ? "success" : ret.status === "REJECTED" ? "sale" : "ink"}>
                {ret.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>

          <ReturnStatusUpdater
            returnId={ret.id}
            currentStatus={ret.status}
            currentRefundAmount={ret.refundAmount != null ? Number(ret.refundAmount) : null}
            currentAdminNote={ret.adminNote}
          />
        </div>
      </div>
    </div>
  );
}
