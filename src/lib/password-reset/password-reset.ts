import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/notifications/password-reset-email";
import type { PasswordResetPurpose } from "@/generated/prisma/client";
import {
  RESET_TOKEN_BYTES,
  RESET_TOKEN_EXPIRY_MINUTES,
  RESET_RESEND_COOLDOWN_SECONDS,
  RESET_MAX_SENDS_PER_EMAIL_PER_HOUR,
  RESET_MAX_SENDS_PER_IP_PER_HOUR,
} from "./constants";

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function purposeForRole(role: string): PasswordResetPurpose {
  return role === "CUSTOMER" ? "CUSTOMER" : "ADMIN";
}

/**
 * Always resolves the same way regardless of whether the email is registered, so callers
 * can return one generic message. Rate limiting and the "don't reveal account existence"
 * requirement are both enforced inside here, never by the caller branching on the result.
 */
export async function requestPasswordReset({ email: rawEmail, ip }: { email: string; ip?: string }): Promise<{ devToken?: string }> {
  const email = normalizeEmail(rawEmail);
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  await db.passwordResetAttempt.create({ data: { email, ip } });

  const [emailAttempts, ipAttempts] = await Promise.all([
    db.passwordResetAttempt.count({ where: { email, createdAt: { gte: hourAgo } } }),
    ip ? db.passwordResetAttempt.count({ where: { ip, createdAt: { gte: hourAgo } } }) : Promise.resolve(0),
  ]);
  if (emailAttempts > RESET_MAX_SENDS_PER_EMAIL_PER_HOUR || (ip && ipAttempts > RESET_MAX_SENDS_PER_IP_PER_HOUR)) {
    return {};
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return {};

  const mostRecent = await db.passwordResetToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  if (mostRecent && mostRecent.createdAt.getTime() + RESET_RESEND_COOLDOWN_SECONDS * 1000 > now.getTime()) {
    return {};
  }

  const purpose = purposeForRole(user.role);
  const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash, purpose, expiresAt, requesterIp: ip },
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      userId: user.id,
      name: user.name,
      purpose,
      rawToken,
      expiryMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error("[password-reset] failed to send reset email", err);
  }

  return { devToken: process.env.NODE_ENV !== "production" ? rawToken : undefined };
}

export type ResetTokenCheck =
  | { valid: true }
  | { valid: false; reason: "MISSING" | "INVALID" | "EXPIRED" | "USED" };

async function loadValidToken(rawToken: string | undefined | null) {
  if (!rawToken) return { row: null as null, reason: "MISSING" as const };

  const tokenHash = hashToken(rawToken);
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!row) return { row: null, reason: "INVALID" as const };
  if (row.usedAt) return { row: null, reason: "USED" as const };
  if (row.expiresAt < new Date()) return { row: null, reason: "EXPIRED" as const };
  if (row.purpose !== purposeForRole(row.user.role)) return { row: null, reason: "INVALID" as const };

  return { row, reason: null };
}

export async function checkResetToken(rawToken: string | undefined | null): Promise<ResetTokenCheck> {
  const { row, reason } = await loadValidToken(rawToken);
  if (!row) return { valid: false, reason: reason ?? "INVALID" };
  return { valid: true };
}

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; reason: "MISSING" | "INVALID" | "EXPIRED" | "USED" };

export async function resetPassword({ token, password }: { token: string | undefined | null; password: string }): Promise<ResetPasswordResult> {
  const { row, reason } = await loadValidToken(token);
  if (!row) return { ok: false, reason: reason ?? "INVALID" };

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash, passwordChangedAt: now } }),
    db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: now } }),
  ]);

  return { ok: true };
}
