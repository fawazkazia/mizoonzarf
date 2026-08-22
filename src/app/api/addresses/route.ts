import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validation/checkout";

const createAddressSchema = addressSchema.extend({ label: z.string().optional() });

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ addresses: [] });

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = createAddressSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

  const count = await db.address.count({ where: { userId: session.user.id } });

  const address = await db.address.create({
    data: { ...body.data, userId: session.user.id, isDefault: count === 0 },
  });

  return NextResponse.json({ ok: true, address });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  await db.address.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { id, isDefault } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  if (isDefault) {
    await db.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }
  await db.address.updateMany({ where: { id, userId: session.user.id }, data: { isDefault: Boolean(isDefault) } });

  return NextResponse.json({ ok: true });
}
