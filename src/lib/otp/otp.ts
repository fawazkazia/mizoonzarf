import crypto from "crypto";
import bcrypt from "bcryptjs";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications/registry";
import type { OtpPurpose } from "@/generated/prisma/client";
import {
  OTP_CODE_LENGTH,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS_PER_IP_PER_HOUR,
  OTP_MAX_SENDS_PER_PHONE_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TEMPLATES,
  GUEST_VERIFIED_PHONE_TTL_DAYS,
} from "./constants";

export function normalizePhone(raw: string): string | null {
  const parsed = parsePhoneNumberFromString(raw);
  return parsed?.isValid() ? parsed.number : null;
}

type SendOtpResult =
  | { ok: true; cooldownSeconds: number; devCode?: string }
  | { ok: false; error: string; code: "INVALID_PHONE" | "COOLDOWN" | "RATE_LIMITED" };

export async function sendOtp({
  phone: rawPhone,
  purpose,
  userId,
  ip,
}: {
  phone: string;
  purpose: OtpPurpose;
  userId?: string;
  ip?: string;
}): Promise<SendOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid mobile number.", code: "INVALID_PHONE" };

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const mostRecent = await db.phoneOtp.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (mostRecent) {
    const cooldownEndsAt = new Date(mostRecent.createdAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    if (cooldownEndsAt > now) {
      return {
        ok: false,
        error: `Please wait ${Math.ceil((cooldownEndsAt.getTime() - now.getTime()) / 1000)}s before requesting another code.`,
        code: "COOLDOWN",
      };
    }
  }

  const [phoneSendCount, ipSendCount] = await Promise.all([
    db.phoneOtp.count({ where: { phone, purpose, createdAt: { gte: hourAgo } } }),
    ip ? db.phoneOtp.count({ where: { requesterIp: ip, createdAt: { gte: hourAgo } } }) : Promise.resolve(0),
  ]);

  if (phoneSendCount >= OTP_MAX_SENDS_PER_PHONE_PER_HOUR || (ip && ipSendCount >= OTP_MAX_SENDS_PER_IP_PER_HOUR)) {
    return { ok: false, error: "Too many verification requests. Please try again later.", code: "RATE_LIMITED" };
  }

  const code = crypto.randomInt(0, 10 ** OTP_CODE_LENGTH).toString().padStart(OTP_CODE_LENGTH, "0");
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.phoneOtp.create({
    data: { phone, purpose, codeHash, userId, expiresAt, requesterIp: ip, maxAttempts: OTP_MAX_ATTEMPTS },
  });

  try {
    await notify({
      channel: "SMS",
      to: phone,
      templateKey: OTP_TEMPLATES[purpose],
      variables: { code, minutes: OTP_EXPIRY_MINUTES },
    });
  } catch (err) {
    console.error("[otp] notify(SMS) failed", err);
  }

  return {
    ok: true,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    devCode: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

type VerifyOtpResult =
  | { ok: true; guestToken?: string }
  | { ok: false; error: string; code: "INVALID_PHONE" | "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "INCORRECT" };

export async function verifyOtp({
  phone: rawPhone,
  purpose,
  code,
  userId,
}: {
  phone: string;
  purpose: OtpPurpose;
  code: string;
  userId?: string;
}): Promise<VerifyOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid mobile number.", code: "INVALID_PHONE" };

  const otpRow = await db.phoneOtp.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRow) return { ok: false, error: "Request a new verification code.", code: "NOT_FOUND" };
  if (otpRow.expiresAt < new Date()) return { ok: false, error: "This code has expired. Please request a new one.", code: "EXPIRED" };
  if (otpRow.attempts >= otpRow.maxAttempts) {
    return { ok: false, error: "Too many incorrect attempts. Please request a new code.", code: "TOO_MANY_ATTEMPTS" };
  }

  const match = await bcrypt.compare(code, otpRow.codeHash);
  if (!match) {
    await db.phoneOtp.update({ where: { id: otpRow.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "Incorrect code. Please try again.", code: "INCORRECT" };
  }

  await db.phoneOtp.update({ where: { id: otpRow.id }, data: { consumedAt: new Date() } });

  if (purpose === "COD_RISK_CONFIRM") {
    return { ok: true };
  }

  // PHONE_VERIFY
  if (userId) {
    await db.user.update({ where: { id: userId }, data: { phone, phoneVerifiedAt: new Date() } });
    const existing = await db.verifiedPhone.findFirst({ where: { phone, userId } });
    if (existing) {
      await db.verifiedPhone.update({ where: { id: existing.id }, data: { verifiedAt: new Date() } });
    } else {
      await db.verifiedPhone.create({ data: { phone, userId, verifiedAt: new Date() } });
    }
    return { ok: true };
  }

  const guestToken = crypto.randomBytes(32).toString("hex");
  await db.verifiedPhone.create({
    data: {
      phone,
      guestToken,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + GUEST_VERIFIED_PHONE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return { ok: true, guestToken };
}
