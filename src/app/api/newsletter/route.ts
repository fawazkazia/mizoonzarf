import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation/review";

export async function POST(req: NextRequest) {
  const body = newsletterSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await db.newsletterSubscriber.upsert({
    where: { email: body.data.email },
    update: { isActive: true },
    create: { email: body.data.email },
  });

  return NextResponse.json({ ok: true });
}
