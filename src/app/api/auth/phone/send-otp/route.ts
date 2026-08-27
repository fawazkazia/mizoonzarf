import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendOtp } from "@/lib/otp/otp";
import { getRequestIp } from "@/lib/otp/ip";

const bodySchema = z.object({
  phone: z.string().min(1),
  purpose: z.enum(["PHONE_VERIFY", "COD_RISK_CONFIRM"]),
});

export async function POST(req: NextRequest) {
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Enter a valid mobile number.", code: "INVALID_PHONE" }, { status: 400 });
  }

  const session = await auth();
  const result = await sendOtp({
    phone: body.data.phone,
    purpose: body.data.purpose,
    userId: session?.user?.id,
    ip: getRequestIp(req),
  });

  if (!result.ok) {
    const status = result.code === "INVALID_PHONE" ? 400 : 429;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ ok: true, cooldownSeconds: result.cooldownSeconds, devCode: result.devCode });
}
