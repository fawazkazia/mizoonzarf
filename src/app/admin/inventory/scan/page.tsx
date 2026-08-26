import { db } from "@/lib/db";
import { InventoryTabs } from "@/components/admin/barcode/InventoryTabs";
import { ScanWorkspace } from "./ScanWorkspace";

export const metadata = { title: "Scan Barcode" };

export default async function ScanPage() {
  const warehouses = await db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Scan Barcode</h1>
      <InventoryTabs />
      <ScanWorkspace warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))} />
    </div>
  );
}
