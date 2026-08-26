import { db } from "@/lib/db";
import { ScanReturnWorkspace } from "./ScanReturnWorkspace";

export const metadata = { title: "Scan Return" };

export default async function ScanReturnPage() {
  const warehouses = await db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Scan Return</h1>
      <p className="text-sm text-ink-soft">Scan a returned item&apos;s barcode to identify the order and resolve it.</p>
      <ScanReturnWorkspace warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))} />
    </div>
  );
}
