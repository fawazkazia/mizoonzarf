import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PackWorkspace } from "./PackWorkspace";

export const metadata = { title: "Pack Order" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackOrderPage({ params }: PageProps) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Pack Order {order.orderNumber}</h1>
        <p className="text-sm text-ink-soft">Scan every item to verify it against the order before marking it packed.</p>
      </div>

      <PackWorkspace
        orderId={order.id}
        status={order.status}
        items={order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          variantLabel: i.variantLabel,
          sku: i.sku,
          quantity: i.quantity,
          packedQuantity: i.packedQuantity,
        }))}
      />
    </div>
  );
}
