import { cache } from "react";
import { db } from "@/lib/db";
import type { ShippingProviderId } from "./provider";

export interface ShippingProviderSettings {
  activeProvider: ShippingProviderId;
  codEnabled: boolean;
  prepaidEnabled: boolean;
  preferredCourierId: string | null;
  defaultWarehouseId: string | null;
  defaultPackageWeightGrams: number;
  defaultDimensionsCm: { length: number; width: number; height: number };
  automation: {
    autoCreateShipment: boolean;
    autoAssignAwb: boolean;
    autoGenerateLabel: boolean;
    autoSchedulePickup: boolean;
  };
  /** Minimum minutes between background tracking polls for a given shipment. */
  trackingSyncFrequencyMinutes: number;
}

const SETTING_KEY = "shipping_provider";

const DEFAULT_SHIPPING_PROVIDER_SETTINGS: ShippingProviderSettings = {
  activeProvider: "MANUAL",
  codEnabled: true,
  prepaidEnabled: true,
  preferredCourierId: null,
  defaultWarehouseId: null,
  defaultPackageWeightGrams: 500,
  defaultDimensionsCm: { length: 20, width: 15, height: 10 },
  automation: {
    autoCreateShipment: false,
    autoAssignAwb: false,
    autoGenerateLabel: false,
    autoSchedulePickup: false,
  },
  trackingSyncFrequencyMinutes: 60,
};

/** Cached per request — same pattern as getSettings() in src/lib/settings.ts. */
export const getShippingProviderSettings = cache(async (): Promise<ShippingProviderSettings> => {
  const row = await db.setting.findUnique({ where: { key: SETTING_KEY } });
  const overrides = (row?.value ?? {}) as Partial<ShippingProviderSettings>;

  return {
    ...DEFAULT_SHIPPING_PROVIDER_SETTINGS,
    ...overrides,
    defaultDimensionsCm: { ...DEFAULT_SHIPPING_PROVIDER_SETTINGS.defaultDimensionsCm, ...(overrides.defaultDimensionsCm ?? {}) },
    automation: { ...DEFAULT_SHIPPING_PROVIDER_SETTINGS.automation, ...(overrides.automation ?? {}) },
  };
});

export async function saveShippingProviderSettings(value: ShippingProviderSettings): Promise<void> {
  await db.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: value as never, group: "shipping" },
    update: { value: value as never },
  });
}
