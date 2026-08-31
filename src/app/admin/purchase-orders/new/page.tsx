import { db } from "@/lib/db";
import { variantAttrs, formatAttrs } from "@/lib/inventory/variant-attributes";
import { PurchaseOrderForm } from "../PurchaseOrderForm";

export const metadata = { title: "New Purchase Order" };

export default async function NewPurchaseOrderPage({ searchParams }: { searchParams: Promise<{ supplierId?: string }> }) {
  const { supplierId } = await searchParams;
  const [suppliers, warehouses, variants] = await Promise.all([
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" }, select: { id: true, name: true } }),
    db.productVariant.findMany({
      orderBy: { sku: "asc" },
      select: { id: true, sku: true, attributeValues: true, size: true, color: true, colorHex: true, costPrice: true, product: { select: { name: true } } },
    }),
  ]);

  const variantOptions = variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    label: `${v.product.name}${formatAttrs(variantAttrs(v)) ? ` — ${formatAttrs(variantAttrs(v))}` : ""}`,
    lastCost: v.costPrice ? Number(v.costPrice) : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">New Purchase Order</h1>
      <PurchaseOrderForm suppliers={suppliers} warehouses={warehouses} variants={variantOptions} initialSupplierId={supplierId} />
    </div>
  );
}
