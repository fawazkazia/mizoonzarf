"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireStaff } from "@/lib/admin-auth";
import { saveShippingProviderSettings, type ShippingProviderSettings } from "@/lib/shipping/settings";
import { shippingProviderSettingsSchema, type ShippingProviderSettingsInput } from "@/lib/validation/admin-shipping";
import { getShippingProvider } from "@/lib/shipping/registry";
import type { ConnectionTestResult } from "@/lib/shipping/provider";

const SHIPPING_ROLES = ["SUPER_ADMIN", "ORDER_MANAGER"] as const;

export async function updateShippingProviderSettings(raw: ShippingProviderSettingsInput) {
  await requireRole([...SHIPPING_ROLES]);
  const input = shippingProviderSettingsSchema.parse(raw);
  await saveShippingProviderSettings(input as ShippingProviderSettings);
  revalidatePath("/admin/shipping");
}

export async function testShiprocketConnection(): Promise<ConnectionTestResult> {
  await requireStaff();
  const provider = getShippingProvider("SHIPROCKET");
  return provider.testConnection();
}

export async function listWarehousesForShipping() {
  await requireStaff();
  return db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } });
}
