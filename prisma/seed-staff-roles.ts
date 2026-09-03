import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedSystemStaffRoles } from "../src/lib/permissions/seed-system-roles";

/**
 * Standalone entry point for seedSystemStaffRoles() — deliberately separate from the main
 * prisma/seed.ts, which also seeds a full demo catalog (products, categories, banners, ...) that
 * must never touch a real environment. This script only creates/updates the 9 system StaffRole
 * rows and backfills staffRoleId on existing accounts; nothing else. Safe to run against
 * production after `prisma migrate deploy` — idempotent, re-runnable any number of times.
 *
 * Usage: npm run db:seed-staff-roles   (reads DATABASE_URL from the environment as normal)
 */
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });
  await seedSystemStaffRoles(db);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
