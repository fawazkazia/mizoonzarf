import { z } from "zod";

export const emailBrandingSchema = z.object({
  senderName: z.string().min(1, "Sender name is required"),
  fromEmailOverride: z.string().refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email or leave blank"),
  replyToEmail: z.string().refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email or leave blank"),
  footerNote: z.string(),
});
export type EmailBrandingInput = z.infer<typeof emailBrandingSchema>;

export const emailTemplateInputSchema = z.object({
  key: z.string().min(1),
  isActive: z.boolean(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});
export type EmailTemplateInput = z.infer<typeof emailTemplateInputSchema>;

export const sendTestEmailSchema = z.object({
  key: z.string().min(1),
  to: z.string().email("Enter a valid email"),
});
