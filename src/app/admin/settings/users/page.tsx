import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Img } from "@/components/ui/ArtImage";
import { getStaffDashboardStats } from "@/lib/data/staff-dashboard";
import { StaffTabs } from "./StaffTabs";
import { CreateStaffForm } from "./CreateStaffForm";
import { StaffRowActions } from "./StaffRowActions";
import { RoleFilterSelect } from "./RoleFilterSelect";

export const metadata = { title: "Staff Management" };

const PER_PAGE = 20;

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; role?: string; department?: string; page?: string }>;
}

const STATUS_TONE: Record<string, "success" | "warning" | "outline"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  DEACTIVATED: "outline",
};

export default async function StaffManagementPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const where: Prisma.UserWhereInput = { role: { not: "CUSTOMER" } };
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q, mode: "insensitive" } },
      { email: { contains: sp.q, mode: "insensitive" } },
      { employeeId: { contains: sp.q, mode: "insensitive" } },
    ];
  }
  if (sp.status) where.status = sp.status as Prisma.UserWhereInput["status"];
  if (sp.role) where.staffRoleId = sp.role;
  if (sp.department) where.department = sp.department;

  const [staff, total, roles, departmentRows, dashboard] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        staffRole: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
        _count: { select: { staffActivityLogs: true } },
      },
    }),
    db.user.count({ where }),
    db.staffRole.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { not: "CUSTOMER" }, department: { not: null } },
      distinct: ["department"],
      select: { department: true },
    }),
    getStaffDashboardStats(),
  ]);

  const departments = departmentRows.map((d) => d.department!).sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Staff &amp; Roles</h1>
        <p className="mt-1 text-sm text-ink-soft">Manage staff accounts, roles, permissions, and activity.</p>
      </div>

      <StaffTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Staff" value={String(dashboard.totalStaff)} />
        <StatCard label="Active" value={String(dashboard.activeStaff)} />
        <StatCard label="Suspended" value={String(dashboard.suspendedStaff)} tone={dashboard.suspendedStaff > 0 ? "warning" : "default"} />
        <StatCard
          label="Online Now"
          value={String(dashboard.onlineNow)}
          hint={
            dashboard.onlineStaff.length > 0
              ? dashboard.onlineStaff
                  .slice(0, 3)
                  .map((s) => s.name)
                  .join(", ") + (dashboard.onlineStaff.length > 3 ? ` +${dashboard.onlineStaff.length - 3} more` : "")
              : `${dashboard.totalRoles} roles defined`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-line bg-paper p-5">
          <h2 className="font-display text-lg">Recent Activity</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {dashboard.recentActivity.length === 0 && <li className="text-ink-soft">No activity recorded yet.</li>}
            {dashboard.recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                <span>
                  <span className="font-medium">{a.actorName}</span> — {a.action.replace(/_/g, " ").toLowerCase()}
                </span>
                <span className="shrink-0 text-xs text-ink-soft">{a.createdAt.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-line bg-paper p-5">
          <h2 className="font-display text-lg">Recent Security Events</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {dashboard.recentSecurityEvents.length === 0 && <li className="text-ink-soft">No login events recorded yet.</li>}
            {dashboard.recentSecurityEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                <span>
                  <span className="font-medium">{e.userName}</span>{" "}
                  <Badge tone={e.event === "LOGIN_FAILED" ? "warning" : "success"} className="ml-1">
                    {e.event.replace("LOGIN_", "")}
                  </Badge>
                  {e.suspicious && (
                    <Badge tone="sale" className="ml-1">
                      Suspicious
                    </Badge>
                  )}
                  {e.ipAddress && <span className="ml-2 text-xs text-ink-soft">{e.ipAddress}</span>}
                </span>
                <span className="shrink-0 text-xs text-ink-soft">{e.createdAt.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <CreateStaffForm roles={roles.map((r) => ({ id: r.id, name: r.name }))} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name, email, or employee ID..." />
        <StatusFilterSelect options={["ACTIVE", "SUSPENDED", "DEACTIVATED"]} paramKey="status" placeholder="All Statuses" />
        <RoleFilterSelect roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
        {departments.length > 0 && <StatusFilterSelect options={departments} paramKey="department" placeholder="All Departments" />}
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Staff</Th>
            <Th>Employee ID</Th>
            <Th>Mobile</Th>
            <Th>Department</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Last Login</Th>
            <Th>Created</Th>
            <Th># Actions</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 && <EmptyRow colSpan={9}>No staff accounts found.</EmptyRow>}
          {staff.map((u) => (
            <tr key={u.id}>
              <Td>
                <Link href={`/admin/settings/users/${u.id}`} className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-paper-dim">
                    <Img src={u.image} alt={u.name ?? u.email} seedFallback={u.id} />
                  </div>
                  <div>
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="text-xs text-ink-soft">{u.email}</p>
                  </div>
                </Link>
              </Td>
              <Td className="text-xs text-ink-soft">{u.employeeId ?? "—"}</Td>
              <Td>{u.phone ?? "—"}</Td>
              <Td>{u.department ?? "—"}</Td>
              <Td>{u.staffRole?.name ?? u.role.replace(/_/g, " ")}</Td>
              <Td>
                <Badge tone={STATUS_TONE[u.status] ?? "outline"}>{u.status}</Badge>
              </Td>
              <Td className="text-xs text-ink-soft">{u.lastActiveAt ? u.lastActiveAt.toLocaleString("en-IN") : "Never"}</Td>
              <Td className="text-xs text-ink-soft">
                {u.createdAt.toLocaleDateString("en-IN")}
                {u.createdBy && <p>by {u.createdBy.name ?? u.createdBy.email}</p>}
              </Td>
              <Td className="text-xs text-ink-soft">{u._count.staffActivityLogs}</Td>
              <Td className="text-right">
                <StaffRowActions userId={u.id} name={u.name ?? u.email} status={u.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.max(Math.ceil(total / PER_PAGE), 1)}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.q) params.set("q", sp.q);
          if (sp.status) params.set("status", sp.status);
          if (sp.role) params.set("role", sp.role);
          if (sp.department) params.set("department", sp.department);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
