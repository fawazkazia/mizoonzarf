import { headers } from "next/headers";
import { db } from "@/lib/db";

export type LogStaffActivityInput = {
  actorId: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
};

/** Writes one append-only row to StaffActivityLog — the real audit trail behind the Staff &
 * Roles "Audit Log" and per-staff "Activity Timeline". Captures IP/user-agent from the current
 * request so sensitive changes are traceable. Never throws — a logging failure must not break
 * the mutation it's describing, so failures are swallowed after a console warning (mirrors the
 * existing non-blocking AuditLog usage in src/lib/orders/status.ts etc). */
/** Round-trips through JSON so Date objects (and anything else non-JSON-native) become plain
 * values before hitting the Json column — Prisma's Json input type doesn't accept Date as-is. */
function toJsonValue(value: unknown): object | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export async function logStaffActivity(input: LogStaffActivityInput): Promise<void> {
  try {
    const h = await headers();
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const userAgent = h.get("user-agent");

    await db.staffActivityLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        before: toJsonValue(input.before),
        after: toJsonValue(input.after),
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.warn("[logStaffActivity] failed to write activity log", err);
  }
}
