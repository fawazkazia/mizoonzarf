import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp/otp";
import { GUEST_VERIFIED_PHONE_TTL_DAYS, GUEST_PHONE_TOKEN_COOKIE } from "@/lib/otp/constants";

const bodySchema = z.object({
  phone: z.string().min(1),
  purpose: z.enum(["PHONE_VERIFY", "COD_RISK_CONFIRM"]),
  code: z.string().min(4).max(8),
});

export async function POST(req: NextRequest) {
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Enter the code we sent you.", code: "INVALID_PHONE" }, { status: 400 });
  }

  const session = await auth();
  const result = await verifyOtp({
    phone: body.data.phone,
    purpose: body.data.purpose,
    code: body.data.code,
    userId: session?.user?.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  if (result.guestToken) {
    response.cookies.set(GUEST_PHONE_TOKEN_COOKIE, result.guestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * GUEST_VERIFIED_PHONE_TTL_DAYS,
      path: "/",
    });
  }
  return response;
}
