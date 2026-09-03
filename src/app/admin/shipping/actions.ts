"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { saveShippingProviderSettings, type ShippingProviderSettings } from "@/lib/shipping/settings";
import { shippingProviderSettingsSchema, type ShippingProviderSettingsInput } from "@/lib/validation/admin-shipping";
import { getShippingProvider } from "@/lib/shipping/registry";
import type { ConnectionTestResult } from "@/lib/shipping/provider";

/** Gated on "orders.edit" rather than "settings.manageWebsite" — this mirrors the original
 * SHIPPING_ROLES = [SUPER_ADMIN, ORDER_MANAGER] list, which scoped shipping-provider config to
 * order fulfillment, not general site settings. */
export async function updateShippingProviderSettings(raw: ShippingProviderSettingsInput) {
  const session = await requirePermission("orders.edit");
  const input = shippingProviderSettingsSchema.parse(raw);
  await saveShippingProviderSettings(input as ShippingProviderSettings);
  await logStaffActivity({ actorId: session.user.id, action: "SHIPPING_PROVIDER_SETTINGS_UPDATED", module: "settings" });
  revalidatePath("/admin/shipping");
}

export async function testShiprocketConnection(): Promise<ConnectionTestResult> {
  await requirePermission("orders.viewShipping");
  const provider = getShippingProvider("SHIPROCKET");
  return provider.testConnection();
}

export async function listWarehousesForShipping() {
  await requirePermission("inventory.view");
  return db.warehouse.findMany({ where: { isActive: true }, orderBy: { isDefault: "desc" } });
}
