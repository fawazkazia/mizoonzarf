import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Pagination } from "@/components/admin/Pagination";
import { StaffTabs } from "../StaffTabs";

export const metadata = { title: "Audit Log" };

const PER_PAGE = 30;

interface PageProps {
  searchParams: Promise<{ actor?: string; module?: string; from?: string; to?: string; page?: string }>;
}

function diffLine(before: unknown, after: unknown): string | null {
  if (before == null && after == null) return null;
  const isScalar = (v: unknown) => v === null || ["string", "number", "boolean"].includes(typeof v);
  if (isScalar(before) && isScalar(after)) return `${before ?? "—"} → ${after ?? "—"}`;
  return null;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const where: Prisma.StaffActivityLogWhereInput = {};
  if (sp.actor) where.actorId = sp.actor;
  if (sp.module) where.module = sp.module;
  if (sp.from || sp.to) {
    where.createdAt = {};
    if (sp.from) where.createdAt.gte = new Date(sp.from);
    if (sp.to) where.createdAt.lte = new Date(`${sp.to}T23:59:59`);
  }

  const [logs, total, actors, modules] = await Promise.all([
    db.staffActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { actor: { select: { name: true, email: true, role: true } } },
    }),
    db.staffActivityLog.count({ where }),
    db.user.findMany({ where: { staffActivityLogs: { some: {} } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    db.staffActivityLog.findMany({ distinct: ["module"], select: { module: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Audit Log</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every recorded staff action — read-only, nothing here can be edited or deleted.
        </p>
      </div>

      <StaffTabs />

      <form method="GET" className="flex flex-wrap items-center gap-3">
        <select name="actor" defaultValue={sp.actor ?? ""} className="border border-line bg-paper px-3 py-2 text-xs uppercase tracking-wide">
          <option value="">All Staff</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name ?? a.email}
            </option>
          ))}
        </select>
        <select name="module" defaultValue={sp.module ?? ""} className="border border-line bg-paper px-3 py-2 text-xs uppercase tracking-wide">
          <option value="">All Modules</option>
          {modules.map((m) => (
            <option key={m.module} value={m.module}>
              {m.module}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} className="border border-line bg-paper px-3 py-2 text-xs" />
        <input type="date" name="to" defaultValue={sp.to ?? ""} className="border border-line bg-paper px-3 py-2 text-xs" />
        <button type="submit" className="border border-ink px-4 py-2 text-xs uppercase tracking-wide hover:bg-paper-dim">
          Filter
        </button>
      </form>

      <Table>
        <thead>
          <tr>
            <Th>Date &amp; Time</Th>
            <Th>Staff</Th>
            <Th>Action</Th>
            <Th>Module</Th>
            <Th>Record</Th>
            <Th>Change</Th>
            <Th>IP Address</Th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && <EmptyRow colSpan={7}>No matching activity.</EmptyRow>}
          {logs.map((log) => {
            const diff = diffLine(log.before, log.after);
            return (
              <tr key={log.id}>
                <Td className="whitespace-nowrap text-xs text-ink-soft">{log.createdAt.toLocaleString("en-IN")}</Td>
                <Td>
                  <p className="font-medium">{log.actor.name ?? log.actor.email}</p>
                  <p className="text-xs text-ink-soft">{log.actor.role.replace(/_/g, " ")}</p>
                </Td>
                <Td>{log.action.replace(/_/g, " ")}</Td>
                <Td className="text-ink-soft">{log.module}</Td>
                <Td className="text-ink-soft">{log.entityType ? `${log.entityType}${log.entityId ? ` ${log.entityId}` : ""}` : "—"}</Td>
                <Td className="max-w-xs truncate text-xs">{diff ?? (log.before || log.after ? "See details" : "—")}</Td>
                <Td className="text-xs text-ink-soft">{log.ipAddress ?? "—"}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.max(Math.ceil(total / PER_PAGE), 1)}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.actor) params.set("actor", sp.actor);
          if (sp.module) params.set("module", sp.module);
          if (sp.from) params.set("from", sp.from);
          if (sp.to) params.set("to", sp.to);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
