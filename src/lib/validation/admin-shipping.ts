import { z } from "zod";

export const shippingProviderSettingsSchema = z.object({
  activeProvider: z.enum(["MANUAL", "SHIPROCKET"]),
  codEnabled: z.boolean(),
  prepaidEnabled: z.boolean(),
  preferredCourierId: z.string().nullable(),
  defaultWarehouseId: z.string().nullable(),
  defaultPackageWeightGrams: z.coerce.number().positive(),
  defaultDimensionsCm: z.object({
    length: z.coerce.number().positive(),
    width: z.coerce.number().positive(),
    height: z.coerce.number().positive(),
  }),
  automation: z.object({
    autoCreateShipment: z.boolean(),
    autoAssignAwb: z.boolean(),
    autoGenerateLabel: z.boolean(),
    autoSchedulePickup: z.boolean(),
  }),
  trackingSyncFrequencyMinutes: z.coerce.number().int().min(5),
});

export type ShippingProviderSettingsInput = z.infer<typeof shippingProviderSettingsSchema>;

export const warehousePickupSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

export type WarehousePickupInput = z.infer<typeof warehousePickupSchema>;
