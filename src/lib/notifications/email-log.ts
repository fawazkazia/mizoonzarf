import { db } from "@/lib/db";
import { Resend } from "resend";
import type { EmailStatus } from "@/generated/prisma/client";

export async function logEmail(params: {
  orderId?: string | null;
  userId?: string | null;
  toEmail: string;
  notificationType: string;
  subject: string;
  htmlBody: string;
  status: EmailStatus;
  errorMessage?: string | null;
  providerMessageId?: string | null;
  isTest?: boolean;
}): Promise<void> {
  try {
    await db.emailLog.create({
      data: {
        orderId: params.orderId ?? null,
        userId: params.userId ?? null,
        toEmail: params.toEmail,
        notificationType: params.notificationType,
        subject: params.subject,
        htmlBody: params.htmlBody,
        status: params.status,
        errorMessage: params.errorMessage ?? null,
        providerMessageId: params.providerMessageId ?? null,
        isTest: params.isTest ?? false,
      },
    });
  } catch (err) {
    console.error("[email-log] failed to write EmailLog row", err);
  }
}

/** Skips a send if the same (orderId, notificationType) was logged very recently — guards double-submits and redelivered webhooks without blocking a legitimate later re-notification. */
export async function wasRecentlySent(orderId: string | null | undefined, notificationType: string, windowSeconds = 30): Promise<boolean> {
  if (!orderId) return false;
  const since = new Date(Date.now() - windowSeconds * 1000);
  const existing = await db.emailLog.findFirst({
    where: { orderId, notificationType, createdAt: { gte: since } },
    select: { id: true },
  });
  return Boolean(existing);
}

/** Re-sends the exact subject/HTML stored at original send time — no re-derivation, so a retry can never drift from what was originally rendered. */
export async function retryEmailLog(logId: string): Promise<void> {
  const row = await db.emailLog.findUniqueOrThrow({ where: { id: logId } });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.log(`[email-log] retry(${row.notificationType}) -> ${row.toEmail} | RESEND not configured, logging only`);
    await db.emailLog.update({
      where: { id: logId },
      data: { status: "SENT", errorMessage: null, retryCount: { increment: 1 }, lastRetriedAt: new Date() },
    });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from: fromEmail, to: row.toEmail, subject: row.subject, html: row.htmlBody });
    if (error) throw new Error(error.message);
    await db.emailLog.update({
      where: { id: logId },
      data: { status: "SENT", errorMessage: null, providerMessageId: data?.id ?? null, retryCount: { increment: 1 }, lastRetriedAt: new Date() },
    });
  } catch (err) {
    await db.emailLog.update({
      where: { id: logId },
      data: { status: "FAILED", errorMessage: err instanceof Error ? err.message : String(err), retryCount: { increment: 1 }, lastRetriedAt: new Date() },
    });
    throw err;
  }
}
