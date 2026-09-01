import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { CUSTOMER_CARE_ROLES } from "@/lib/admin-permissions";

/** Customer search for the Customer Care Dashboard — by name, mobile number, email, or order
 * ID, per spec: an employee on a call rarely has anything but one of these four. */
export async function GET(req: NextRequest) {
  try {
    await requireRole(CUSTOMER_CARE_ROLES);
  } catch {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ customers: [] });

  const customers = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { orders: { some: { orderNumber: { contains: q, mode: "insensitive" } } } },
      ],
    },
    select: { id: true, name: true, email: true, phone: true },
    take: 8,
  });

  return NextResponse.json({ customers });
}
