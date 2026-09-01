import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { CUSTOMER_CARE_MANAGER_ROLES } from "@/lib/admin-permissions";
import { isTicketOverdue } from "@/lib/customer-care/sla";

function csvEscape(value: unknown): string {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(CUSTOMER_CARE_MANAGER_ROLES);
  } catch {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(Date.now() - 30 * 86_400_000);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

  const tickets = await db.ticket.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { name: true, email: true } },
      customer: { select: { name: true, email: true } },
      order: { select: { orderNumber: true } },
    },
  });

  const rows = [
    ["Ticket #", "Category", "Priority", "Status", "Assigned To", "Created", "First Response", "Resolved", "Resolution Hours", "Overdue", "Order #", "Customer"].join(","),
  ];

  for (const t of tickets) {
    const resolutionHours = t.resolvedAt ? Math.round(((t.resolvedAt.getTime() - t.createdAt.getTime()) / 3_600_000) * 10) / 10 : "";
    rows.push(
      [
        t.ticketNumber,
        t.category,
        t.priority,
        t.status,
        t.assignedTo?.name ?? t.assignedTo?.email ?? "",
        t.createdAt.toISOString(),
        t.firstRespondedAt?.toISOString() ?? "",
        t.resolvedAt?.toISOString() ?? "",
        resolutionHours,
        isTicketOverdue(t) ? "Y" : "N",
        t.order?.orderNumber ?? "",
        t.customer?.name ?? t.customer?.email ?? t.guestName ?? t.guestEmail ?? "Guest",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="customer-care-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
