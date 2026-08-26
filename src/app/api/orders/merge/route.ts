import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { linkGuestOrdersToUser } from "@/lib/orders/link-guest-orders";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  await linkGuestOrdersToUser(session.user.id, session.user.email);
  return NextResponse.json({ ok: true });
}
