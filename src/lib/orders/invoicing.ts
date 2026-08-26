import type { Prisma } from "@/generated/prisma/client";

/** Indian financial year runs Apr 1 – Mar 31, e.g. Aug 2026 and Feb 2027 are both "2026-27". */
function financialYearFor(date: Date): string {
  const year = date.getFullYear();
  const startYear = date.getMonth() < 3 /* Jan-Mar */ ? year - 1 : year;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

/**
 * Assigns the next sequential GST invoice number for the current Indian
 * financial year. Must run inside the same transaction that transitions an
 * order to PAID, and only on the branch where that transition actually
 * happens for the first time — GST invoice numbers must be gap-free, so a
 * redundant webhook redelivery must never consume a second number.
 *
 * Safe under concurrency: the upsert's update branch compiles to an
 * atomically row-locked `UPDATE ... SET lastNumber = lastNumber + 1` in
 * Postgres, so concurrent calls serialize on that row instead of racing a
 * read-then-write.
 */
export async function generateInvoiceNumber(
  tx: Prisma.TransactionClient,
  date: Date = new Date()
): Promise<{ number: string; date: Date }> {
  const financialYear = financialYearFor(date);
  const counter = await tx.invoiceCounter.upsert({
    where: { financialYear },
    create: { financialYear, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  const number = `INV-${financialYear}-${String(counter.lastNumber).padStart(6, "0")}`;
  return { number, date };
}
