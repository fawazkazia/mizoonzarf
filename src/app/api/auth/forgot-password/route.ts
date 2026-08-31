import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/lib/password-reset/password-reset";
import { getRequestIp } from "@/lib/otp/ip";

const GENERIC_MESSAGE = "If an account exists with this email, you will receive password reset instructions.";

export async function POST(req: NextRequest) {
  const body = forgotPasswordSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const result = await requestPasswordReset({ email: body.data.email, ip: getRequestIp(req) });

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE, devToken: result.devToken });
}
