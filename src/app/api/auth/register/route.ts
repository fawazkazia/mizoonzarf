import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
  const body = registerSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const { name, email, password } = body.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({ data: { name, email, passwordHash } });

  return NextResponse.json({ ok: true });
}
