import { z } from "zod";

export const returnRequestSchema = z.object({
  orderItemId: z.string().min(1),
  reason: z.string().min(3, "Please select or describe a reason."),
  description: z.string().optional(),
});
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;

export const RETURN_REASONS = [
  "Wrong size or fit",
  "Item damaged or defective",
  "Not as described",
  "Changed my mind",
  "Received wrong item",
  "Other",
] as const;
