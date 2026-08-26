"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireStaff } from "@/lib/admin-auth";
import { getShippingProvider } from "@/lib/shipping/registry";

const INVENTORY_ROLES = ["SUPER_ADMIN", "INVENTORY_MANAGER"] as const;

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
  await requireStaff();
  return db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } });
}

function revalidateWarehousePaths() {
  revalidatePath("/admin/inventory/warehouses");
  revalidatePath("/admin/inventory");
}

export async function createWarehouse(data: { name: string; code: string; address?: string }) {
  await requireRole([...INVENTORY_ROLES]);
  const code = data.code.trim().toUpperCase();
  const existing = await db.warehouse.findUnique({ where: { code } });
  if (existing) throw new Error(`Warehouse code "${code}" is already in use.`);

  const warehouse = await db.warehouse.create({ data: { name: data.name.trim(), code, address: data.address || null } });
  revalidateWarehousePaths();
  return warehouse;
}

export async function updateWarehouse(id: string, data: { name: string; address?: string; isActive: boolean }) {
  await requireRole([...INVENTORY_ROLES]);
  const warehouse = await db.warehouse.update({
    where: { id },
    data: { name: data.name.trim(), address: data.address || null, isActive: data.isActive },
  });
  revalidateWarehousePaths();
  return warehouse;
}

export async function deactivateWarehouse(id: string) {
  await requireRole([...INVENTORY_ROLES]);
  const warehouse = await db.warehouse.findUniqueOrThrow({ where: { id } });
  if (warehouse.isDefault) throw new Error("Can't deactivate the default warehouse.");
  await db.warehouse.update({ where: { id }, data: { isActive: false } });
  revalidateWarehousePaths();
}

export async function updateWarehousePickupDetails(id: string, data: WarehousePickupDetails) {
  await requireRole([...INVENTORY_ROLES]);
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
  revalidateWarehousePaths();
  revalidatePath("/admin/shipping");
  return warehouse;
}

/** Registers this warehouse as a Shiprocket pickup location and stores the returned nickname. */
export async function registerWarehouseWithShiprocket(id: string) {
  await requireRole([...INVENTORY_ROLES]);
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
  revalidateWarehousePaths();
  return result;
}
