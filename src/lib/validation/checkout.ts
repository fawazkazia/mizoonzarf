import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2, "Enter the recipient's full name"),
  phone: z.string().min(7, "Enter a valid phone number"),
  line1: z.string().min(3, "Enter the street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter a city"),
  state: z.string().optional(),
  country: z.string().default("AE"),
  postalCode: z.string().optional(),
});

export const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  address: addressSchema,
  saveAddress: z.boolean().optional(),
  addressId: z.string().optional(),
  deliveryMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["COD", "CARD", "APPLE_PAY", "GOOGLE_PAY", "PAYPAL", "TABBY", "TAMARA"]),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
