import { Resend } from "resend";
import { getSettings } from "@/lib/settings";
import { logEmail } from "./email-log";
import { renderBrandShell, renderButton, escapeHtml } from "./email-template";
import { siteUrl } from "./order-email";
import type { PasswordResetPurpose } from "@/generated/prisma/client";

const COLOR_INK_SOFT = "#5c584e";

function buildResetHtml(params: {
  settings: Awaited<ReturnType<typeof getSettings>>;
  senderName: string;
  greetingName: string;
  purpose: PasswordResetPurpose;
  resetUrl: string;
  expiryMinutes: number;
}): string {
  const { settings, senderName, greetingName, purpose, resetUrl, expiryMinutes } = params;
  const isAdmin = purpose === "ADMIN";

  const contentHtml = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#14130f;">Reset your password</h1>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#14130f;">Hi ${escapeHtml(greetingName)},</p>
    <p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:#14130f;">
      We received a request to reset the password for your ${isAdmin ? `${escapeHtml(senderName)} admin account` : `${escapeHtml(senderName)} account`}.
      Click the button below to choose a new password.
    </p>
    ${renderButton("Reset Password", resetUrl)}
    <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:${COLOR_INK_SOFT};">
      This link expires in ${expiryMinutes} minutes and can only be used once.
    </p>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:${COLOR_INK_SOFT};">
      If you didn't request this, you can safely ignore this email — your password will not be changed.
      For your security, we never send your existing password by email.
    </p>
  `;

  return renderBrandShell({
    settings,
    siteUrl: siteUrl(),
    senderName,
    footerNote: settings.email.footerNote,
    preheader: "Reset your password",
    contentHtml,
  });
}

/** Sends the branded password-reset email and logs it — mirrors sendOrderEmail's send/log flow but with no order or admin-editable template involved, since a reset link is fixed, security-critical copy. */
export async function sendPasswordResetEmail(params: {
  to: string;
  userId: string;
  name: string | null;
  purpose: PasswordResetPurpose;
  rawToken: string;
  expiryMinutes: number;
}): Promise<void> {
  const { to, userId, name, purpose, rawToken, expiryMinutes } = params;
  const settings = await getSettings();
  const senderName = settings.email.senderName || settings.brandName;
  const isAdmin = purpose === "ADMIN";
  const subject = isAdmin ? `Reset your ${senderName} Admin password` : `Reset your ${senderName} password`;
  const resetUrl = `${siteUrl().replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const html = buildResetHtml({
    settings,
    senderName,
    greetingName: name || "there",
    purpose,
    resetUrl,
    expiryMinutes,
  });
  // EmailLog is an audit/resend table, not a secret store — never persist the live, usable
  // reset link there. Only the copy actually handed to Resend carries the real token.
  const redactedHtml = html.split(rawToken).join("[REDACTED]");

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = settings.email.fromEmailOverride || process.env.RESEND_FROM_EMAIL;
  const replyTo = settings.email.replyToEmail || settings.supportEmail;
  const notificationType = isAdmin ? "password_reset_admin" : "password_reset_customer";

  if (apiKey && fromEmail) {
    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({ from: `${senderName} <${fromEmail}>`, to, subject, html, replyTo });
      if (error) throw new Error(error.message);
      await logEmail({ userId, toEmail: to, notificationType, subject, htmlBody: redactedHtml, status: "SENT", providerMessageId: data?.id ?? null });
    } catch (err) {
      await logEmail({
        userId,
        toEmail: to,
        notificationType,
        subject,
        htmlBody: redactedHtml,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  } else {
    console.log(`[password-reset-email] RESEND not configured — logging only | to=${to} | subject="${subject}"`);
    await logEmail({ userId, toEmail: to, notificationType, subject, htmlBody: redactedHtml, status: "SENT" });
  }
}
