import type { NextRequest } from "next/server";

/**
 * Best-effort caller IP for OTP rate limiting. Depends on a reverse proxy (Vercel does this
 * automatically) setting these headers — if nothing sets them, IP-based limiting silently
 * no-ops and the per-phone limits in src/lib/otp/otp.ts remain the real backstop.
 */
export function getRequestIp(req: NextRequest): string | undefined {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return undefined;
}
