import { Resend } from "resend";
import { getSettings } from "@/lib/settings";
import { renderTemplate } from "./templates";
import { logEmail } from "./email-log";
import { buildOrderEmailHtml, textToHtml } from "./email-template";

/**
 * Sends a Customer Care email — either a templated system notice (ticket_created/
 * ticket_resolved, rendered via renderTemplate like every other transactional email) or a
 * staff-composed reply (pass bodyOverride/subjectOverride, skipping template lookup entirely).
 * Mirrors sendOrderEmail()'s Resend-or-console-fallback branch and never throws — callers
 * don't need their own try/catch.
 */
export async function sendTicketEmail(params: {
  ticketId: string;
  to: string | null | undefined;
  userId?: string | null;
  templateKey: string;
  variables?: Record<string, string | number>;
  bodyOverride?: string;
  subjectOverride?: string;
}): Promise<boolean> {
  const { ticketId, to, userId, templateKey, variables = {}, bodyOverride, subjectOverride } = params;
  if (!to) return false;

  try {
    const settings = await getSettings();
    let finalSubject = subjectOverride;
    let finalBody = bodyOverride;
    if (!finalBody) {
      const rendered = await renderTemplate(templateKey, "EMAIL", variables);
      finalSubject = finalSubject ?? rendered.subject;
      finalBody = rendered.body;
    }
    finalSubject = finalSubject ?? "Update on your support ticket";

    const senderName = settings.email.senderName || settings.brandName;
    const html = buildOrderEmailHtml({
      settings,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      senderName,
      footerNote: settings.email.footerNote,
      title: finalSubject,
      introHtml: textToHtml(finalBody),
      order: null,
      includeTracking: false,
    });

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = settings.email.fromEmailOverride || process.env.RESEND_FROM_EMAIL;
    const replyTo = settings.email.replyToEmail || settings.supportEmail;

    if (apiKey && fromEmail) {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({ from: `${senderName} <${fromEmail}>`, to, subject: finalSubject, html, replyTo });
      if (error) throw new Error(error.message);
      await logEmail({ userId, ticketId, toEmail: to, notificationType: templateKey, subject: finalSubject, htmlBody: html, status: "SENT", providerMessageId: data?.id ?? null });
    } else {
      console.log(`[ticket-email:${templateKey}] -> ${to} | RESEND not configured, logging only | subject="${finalSubject}"`);
      await logEmail({ userId, ticketId, toEmail: to, notificationType: templateKey, subject: finalSubject, htmlBody: html, status: "SENT" });
    }
    return true;
  } catch (err) {
    console.error(`[ticket-email] sendTicketEmail(${templateKey}) failed`, err);
    await logEmail({
      userId,
      ticketId,
      toEmail: to,
      notificationType: templateKey,
      subject: subjectOverride ?? "Update on your support ticket",
      htmlBody: "",
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
