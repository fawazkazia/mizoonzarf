import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { checkResetToken, resetPassword } from "@/lib/password-reset/password-reset";

const REASON_MESSAGES: Record<string, string> = {
  MISSING: "This reset link is missing its token.",
  INVALID: "This reset link is invalid.",
  EXPIRED: "This reset link has expired. Please request a new one.",
  USED: "This reset link has already been used.",
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const result = await checkResetToken(token);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: REASON_MESSAGES[result.reason] }, { status: 400 });
  }
  return NextResponse.json({ valid: true });
}

export async function POST(req: NextRequest) {
  const body = resetPasswordSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const result = await resetPassword({ token: body.data.token, password: body.data.password });
  if (!result.ok) {
    return NextResponse.json({ error: REASON_MESSAGES[result.reason] }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
