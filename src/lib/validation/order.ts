import { z } from "zod";

export const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Changed my mind",
  "Delivery is taking too long",
  "Ordered the wrong item or size",
  "Other",
] as const;

export const cancelOrderSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3, "Please select or describe a reason."),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
