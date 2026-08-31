/**
 * Standing smoke test for the double-entry ledger (Finance foundation). Confirms every
 * JournalEntry ever posted has equal debits and credits — the app-level `assertBalanced` guard
 * in src/lib/finance/ledger.ts checks this before every insert, but this catches anything that
 * bypassed that path (e.g. a hand-run `psql` mistake). Safe to re-run any time; read-only.
 *
 * Usage: npx tsx scripts/verify-ledger.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const unbalanced = await db.$queryRawUnsafe<{ entryId: string; debit: string; credit: string }[]>(`
    SELECT "entryId", ROUND(SUM(debit)::numeric, 2) as debit, ROUND(SUM(credit)::numeric, 2) as credit
    FROM journal_lines
    GROUP BY "entryId"
    HAVING ROUND(SUM(debit)::numeric, 2) <> ROUND(SUM(credit)::numeric, 2);
  `);

  const entryCount = await db.journalEntry.count();
  console.log(`Journal entries posted: ${entryCount}`);

  if (unbalanced.length === 0) {
    console.log("OK — every journal entry balances (debits = credits).");
    return;
  }

  console.error(`FAILED — ${unbalanced.length} unbalanced journal entr${unbalanced.length === 1 ? "y" : "ies"}:`);
  console.error(unbalanced);
  process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
