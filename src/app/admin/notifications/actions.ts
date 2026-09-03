"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions/require-permission";
import { logStaffActivity } from "@/lib/permissions/log-activity";
import { getSettings } from "@/lib/settings";
import { emailBrandingSchema, emailTemplateInputSchema, sendTestEmailSchema, type EmailBrandingInput, type EmailTemplateInput } from "@/lib/validation/admin-notifications";
import { interpolate } from "@/lib/notifications/templates";
import { buildOrderEmailHtml, textToHtml } from "@/lib/notifications/email-template";
import { buildSampleOrder, getEmailNotificationDef } from "@/lib/notifications/catalog";
import { TRACKING_AWARE_KEYS, siteUrl } from "@/lib/notifications/order-email";
import { logEmail, retryEmailLog } from "@/lib/notifications/email-log";
import type { Prisma } from "@/generated/prisma/client";

export async function upsertEmailTemplate(raw: EmailTemplateInput) {
  const session = await requirePermission("settings.manageWebsite");
  const input = emailTemplateInputSchema.parse(raw);

  await db.notificationTemplate.upsert({
    where: { key_channel: { key: input.key, channel: "EMAIL" } },
    update: { subject: input.subject, body: input.body, isActive: input.isActive },
    create: { key: input.key, channel: "EMAIL", subject: input.subject, body: input.body, isActive: input.isActive },
  });

  await logStaffActivity({ actorId: session.user.id, action: "EMAIL_TEMPLATE_SAVED", module: "settings", entityType: "NotificationTemplate", entityId: input.key });
  revalidatePath("/admin/notifications");
}

export async function updateEmailBrandingSettings(raw: EmailBrandingInput) {
  const session = await requirePermission("settings.manageWebsite");
  const input = emailBrandingSchema.parse(raw);

  await db.setting.upsert({
    where: { key: "email" },
    create: { key: "email", value: input as Prisma.InputJsonValue, group: "email" },
    update: { value: input as Prisma.InputJsonValue },
  });

  await logStaffActivity({ actorId: session.user.id, action: "EMAIL_BRANDING_UPDATED", module: "settings" });
  revalidatePath("/", "layout");
  revalidatePath("/admin/notifications");
}

/** Renders the given (possibly unsaved) subject/body against the sample order fixture — no send, no log. */
export async function previewEmailTemplate(input: { key: string; subject: string; body: string }): Promise<string> {
  await requirePermission("settings.manageWebsite");
  const def = getEmailNotificationDef(input.key);
  if (!def) throw new Error("Unknown notification type.");

  const settings = await getSettings();
  const order = buildSampleOrder();
  const variables = { ...def.sampleVariables };
  const subject = interpolate(input.subject, variables);
  const body = interpolate(input.body, variables);

  return buildOrderEmailHtml({
    settings,
    siteUrl: siteUrl(),
    senderName: settings.email.senderName || settings.brandName,
    footerNote: settings.email.footerNote,
    title: subject,
    introHtml: textToHtml(body),
    order,
    includeTracking: TRACKING_AWARE_KEYS.has(input.key),
  });
}

export async function sendTestEmail(raw: { key: string; to: string; subject: string; body: string }) {
  const session = await requirePermission("settings.manageWebsite");
  const parsed = sendTestEmailSchema.parse({ key: raw.key, to: raw.to });
  const def = getEmailNotificationDef(parsed.key);
  if (!def) throw new Error("Unknown notification type.");

  const html = await previewEmailTemplate({ key: raw.key, subject: raw.subject, body: raw.body });
  const settings = await getSettings();
  const variables = { ...def.sampleVariables };
  const subject = `[TEST] ${interpolate(raw.subject, variables)}`;

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = settings.email.fromEmailOverride || process.env.RESEND_FROM_EMAIL;
  const senderName = settings.email.senderName || settings.brandName;

  if (!apiKey || !fromEmail) {
    console.log(`[notifications] sendTestEmail(${parsed.key}) -> ${parsed.to} | RESEND not configured, logging only`);
    await logEmail({ toEmail: parsed.to, notificationType: parsed.key, subject, htmlBody: html, status: "SENT", isTest: true, userId: session.user.id });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from: `${senderName} <${fromEmail}>`, to: parsed.to, subject, html });
    if (error) throw new Error(error.message);
    await logEmail({ toEmail: parsed.to, notificationType: parsed.key, subject, htmlBody: html, status: "SENT", providerMessageId: data?.id ?? null, isTest: true, userId: session.user.id });
  } catch (err) {
    await logEmail({
      toEmail: parsed.to,
      notificationType: parsed.key,
      subject,
      htmlBody: html,
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : String(err),
      isTest: true,
      userId: session.user.id,
    });
    throw err;
  }

  revalidatePath("/admin/notifications");
}

export async function retryFailedEmail(logId: string) {
  const session = await requirePermission("settings.manageWebsite");
  await retryEmailLog(logId);
  await logStaffActivity({ actorId: session.user.id, action: "EMAIL_RETRY", module: "settings", entityType: "EmailLog", entityId: logId });
  revalidatePath("/admin/notifications");
}
