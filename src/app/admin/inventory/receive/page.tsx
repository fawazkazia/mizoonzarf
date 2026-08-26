import { db } from "@/lib/db";
import { InventoryTabs } from "@/components/admin/barcode/InventoryTabs";
import { ReceiveWorkspace } from "./ReceiveWorkspace";

export const metadata = { title: "Receive Stock" };

export default async function ReceiveStockPage() {
  const warehouses = await db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Receive Stock</h1>
      <InventoryTabs />
      <ReceiveWorkspace warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))} />
    </div>
  );
}
