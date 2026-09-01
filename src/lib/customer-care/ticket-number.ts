import type { Prisma } from "@/generated/prisma/client";

/**
 * Assigns the next sequential ticket number for the current calendar year.
 * Same race-safe upsert pattern as generateInvoiceNumber (src/lib/orders/invoicing.ts) —
 * the upsert's update branch compiles to an atomically row-locked
 * `UPDATE ... SET lastNumber = lastNumber + 1` in Postgres, so concurrent ticket creation
 * serializes on that row instead of racing a read-then-write.
 */
export async function generateTicketNumber(tx: Prisma.TransactionClient, date: Date = new Date()): Promise<string> {
  const year = String(date.getFullYear());
  const counter = await tx.ticketCounter.upsert({
    where: { year },
    create: { year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `TKT-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
}
