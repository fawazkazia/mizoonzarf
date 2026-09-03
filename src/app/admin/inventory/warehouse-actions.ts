"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { getShippingProvider } from "@/lib/shipping/registry";

export interface WarehousePickupDetails {
  address?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export async function listWarehouses() {
  await requirePermission("inventory.view");
  return db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } });
}

function revalidateWarehousePaths() {
  revalidatePath("/admin/inventory/warehouses");
  revalidatePath("/admin/inventory");
}

export async function createWarehouse(data: { name: string; code: string; address?: string }) {
  const session = await requirePermission("inventory.edit");
  const code = data.code.trim().toUpperCase();
  const existing = await db.warehouse.findUnique({ where: { code } });
  if (existing) throw new Error(`Warehouse code "${code}" is already in use.`);

  const warehouse = await db.warehouse.create({ data: { name: data.name.trim(), code, address: data.address || null } });
  await logStaffActivity({ actorId: session.user.id, action: "WAREHOUSE_CREATED", module: "inventory", entityType: "Warehouse", entityId: warehouse.id, after: { name: warehouse.name, code } });
  revalidateWarehousePaths();
  return warehouse;
}

export async function updateWarehouse(id: string, data: { name: string; address?: string; isActive: boolean }) {
  const session = await requirePermission("inventory.edit");
  const warehouse = await db.warehouse.update({
    where: { id },
    data: { name: data.name.trim(), address: data.address || null, isActive: data.isActive },
  });
  await logStaffActivity({ actorId: session.user.id, action: "WAREHOUSE_UPDATED", module: "inventory", entityType: "Warehouse", entityId: id, after: { name: warehouse.name, isActive: warehouse.isActive } });
  revalidateWarehousePaths();
  return warehouse;
}

export async function deactivateWarehouse(id: string) {
  const session = await requirePermission("inventory.edit");
  const warehouse = await db.warehouse.findUniqueOrThrow({ where: { id } });
  if (warehouse.isDefault) throw new Error("Can't deactivate the default warehouse.");
  await db.warehouse.update({ where: { id }, data: { isActive: false } });
  await logStaffActivity({ actorId: session.user.id, action: "WAREHOUSE_DEACTIVATED", module: "inventory", entityType: "Warehouse", entityId: id, before: { name: warehouse.name } });
  revalidateWarehousePaths();
}

export async function updateWarehousePickupDetails(id: string, data: WarehousePickupDetails) {
  const session = await requirePermission("inventory.edit");
  const warehouse = await db.warehouse.update({
    where: { id },
    data: {
      address: data.address || null,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || "IN",
      pincode: data.pincode || null,
    },
  });
  await logStaffActivity({ actorId: session.user.id, action: "WAREHOUSE_PICKUP_DETAILS_UPDATED", module: "inventory", entityType: "Warehouse", entityId: id });
  revalidateWarehousePaths();
  revalidatePath("/admin/shipping");
  return warehouse;
}

/** Registers this warehouse as a Shiprocket pickup location and stores the returned nickname. */
export async function registerWarehouseWithShiprocket(id: string) {
  const session = await requirePermission("inventory.edit");
  const warehouse = await db.warehouse.findUniqueOrThrow({ where: { id } });

  if (!warehouse.address || !warehouse.city || !warehouse.pincode || !warehouse.phone) {
    throw new Error("Fill in the pickup address, city, PIN code, and phone number before registering with Shiprocket.");
  }

  const provider = getShippingProvider("SHIPROCKET");
  if (!provider.registerPickupLocation) throw new Error("The active courier provider doesn't support pickup-location registration.");

  const result = await provider.registerPickupLocation({
    label: warehouse.name,
    contact: { name: warehouse.contactName || warehouse.name, phone: warehouse.phone, email: warehouse.email || undefined },
    address: {
      line1: warehouse.address,
      line2: warehouse.addressLine2 || undefined,
      city: warehouse.city,
      state: warehouse.state || undefined,
      country: warehouse.country || "IN",
      pincode: warehouse.pincode,
    },
  });

  await db.warehouse.update({ where: { id }, data: { shiprocketPickupLocation: result.pickupLocationName } });
  await logStaffActivity({ actorId: session.user.id, action: "WAREHOUSE_SHIPROCKET_REGISTERED", module: "inventory", entityType: "Warehouse", entityId: id, after: { pickupLocationName: result.pickupLocationName } });
  revalidateWarehousePaths();
  return result;
}
