import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/server/cart";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  await mergeGuestCartIntoUser(session.user.id);
  return NextResponse.json({ ok: true });
}
