import { db } from "@/lib/db";
import { normalizePhone } from "./otp";

interface CheckoutVerificationInput {
  phone: string;
  userId?: string;
  guestPhoneToken?: string;
}

/**
 * Server-side source of truth for "can this checkout proceed" — never trusts a client-sent
 * boolean. Signed-in customers must have verified the exact phone they're checking out with;
 * guests must hold a non-expired VerifiedPhone row matching both their cookie token and the
 * submitted phone. See src/app/api/checkout/route.ts for the enforcement call site.
 */
export async function resolveCheckoutPhoneVerification({ phone, userId, guestPhoneToken }: CheckoutVerificationInput): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;

  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { phone: true, phoneVerifiedAt: true } });
    return Boolean(user?.phoneVerifiedAt && user.phone === normalized);
  }

  if (!guestPhoneToken) return false;

  const verified = await db.verifiedPhone.findUnique({ where: { guestToken: guestPhoneToken } });
  if (!verified || verified.phone !== normalized) return false;
  if (verified.expiresAt && verified.expiresAt < new Date()) return false;

  return true;
}
