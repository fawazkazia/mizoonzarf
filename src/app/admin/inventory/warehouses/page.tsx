import { db } from "@/lib/db";
import { InventoryTabs } from "@/components/admin/barcode/InventoryTabs";
import { WarehouseManager } from "./WarehouseManager";

export const metadata = { title: "Warehouses" };

export default async function WarehousesPage() {
  const warehouses = await db.warehouse.findMany({ orderBy: { isDefault: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Warehouses</h1>
      <InventoryTabs />
      <WarehouseManager
        warehouses={warehouses.map((w) => ({
          id: w.id,
          name: w.name,
          code: w.code,
          address: w.address,
          isActive: w.isActive,
          isDefault: w.isDefault,
          contactName: w.contactName,
          phone: w.phone,
          email: w.email,
          addressLine2: w.addressLine2,
          city: w.city,
          state: w.state,
          country: w.country,
          pincode: w.pincode,
          shiprocketPickupLocation: w.shiprocketPickupLocation,
        }))}
      />
    </div>
  );
}
