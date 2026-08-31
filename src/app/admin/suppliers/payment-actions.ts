"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/admin-auth";
import { FINANCE_ROLES } from "@/lib/admin-permissions";
import { postSupplierPaymentEntry } from "@/lib/finance/ledger";

/**
 * Posts inside the same transaction as the Invoice update (staff-driven, no customer-facing
 * latency concern — same blocking pattern as PO receiving/expenses). The amount is validated
 * against the invoice's own stored outstanding balance, never trusted from the client beyond
 * that bound.
 */
export async function recordSupplierPayment(invoiceId: string, amount: number) {
  const session = await requireRole(FINANCE_ROLES);
  if (amount <= 0) throw new Error("Amount must be positive.");

  await db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    if (invoice.type !== "PURCHASE") throw new Error("Not a purchase invoice.");
    const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
    if (amount > outstanding + 0.01) throw new Error(`Only ${outstanding.toFixed(2)} is outstanding on this invoice.`);

    const newAmountPaid = Number(invoice.amountPaid) + amount;
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: newAmountPaid >= Number(invoice.total) - 0.01 ? "PAID" : "PARTIALLY_PAID",
      },
    });

    await postSupplierPaymentEntry(tx, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      createdById: session.user.id,
    });
  });

  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/finance");
}
