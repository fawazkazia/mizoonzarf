import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

const INDIA_PIN_CODE = /^[1-9][0-9]{5}$/;

/** Plain object form — kept separate from addressSchema so callers (e.g. the address book's PATCH endpoint) can still use `.partial()`, which ZodEffects (the result of .superRefine) doesn't support. */
export const addressObjectSchema = z.object({
  fullName: z.string().min(2, "Enter the recipient's full name"),
  phone: z.string().refine((v) => isValidPhoneNumber(v), "Enter a valid phone number"),
  line1: z.string().min(3, "Enter the street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter a city"),
  state: z.string().optional(),
  country: z.string().length(2, "Enter a valid country code").default("IN"),
  postalCode: z.string().optional(),
  label: z.string().optional(),
});

export const addressSchema = addressObjectSchema.superRefine((value, ctx) => {
  if (value.country === "IN" && !INDIA_PIN_CODE.test(value.postalCode ?? "")) {
    ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Enter a valid 6-digit PIN code" });
  }
});

export const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  phone: z.string().refine((v) => isValidPhoneNumber(v), "Enter a valid phone number"),
  address: addressSchema,
  saveAddress: z.boolean().optional(),
  addressId: z.string().optional(),
  deliveryMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["COD", "CARD", "RAZORPAY", "APPLE_PAY", "GOOGLE_PAY", "PAYPAL", "TABBY", "TAMARA"]),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  /** B2B buyer's GSTIN, for input tax credit — optional, not part of the address. */
  gstin: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
