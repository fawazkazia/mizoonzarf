import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { Img } from "@/components/ui/ArtImage";
import { computeEffectivePermissions } from "@/lib/permissions/resolve";
import { permissionLabel } from "@/lib/permissions/catalog";
import { formatUserAgent } from "@/lib/permissions/parse-user-agent";
import { getSuspiciousLoginUserIds } from "@/lib/permissions/suspicious-activity";
import { StaffTabs } from "../StaffTabs";
import { StaffRoleSelect } from "./StaffRoleSelect";
import { EditStaffProfileForm } from "./EditStaffProfileForm";
import { PermissionOverridesEditor } from "./PermissionOverridesEditor";
import { ProfileActions } from "./ProfileActions";

export const metadata = { title: "Staff Profile" };

const STATUS_TONE: Record<string, "success" | "warning" | "outline"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  DEACTIVATED: "outline",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffProfilePage({ params }: PageProps) {
  const { id } = await params;

  const [user, roles, activity, logins, moduleCounts, suspiciousUserIds] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: { staffRole: true, createdBy: { select: { name: true, email: true } } },
    }),
    db.staffRole.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.staffActivityLog.findMany({ where: { actorId: id }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.loginHistory.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.staffActivityLog.groupBy({ by: ["module"], where: { actorId: id }, _count: true }),
    getSuspiciousLoginUserIds(),
  ]);

  if (!user || user.role === "CUSTOMER") notFound();

  const effectivePermissions = computeEffectivePermissions({
    role: user.role,
    staffRolePermissions: user.staffRole?.permissions,
    permissionOverrides: user.permissionOverrides,
    permissionRevocations: user.permissionRevocations,
  });

  const totalActions = moduleCounts.reduce((sum, m) => sum + m._count, 0);
  const moduleLabel: Record<string, string> = { staff: "Staff & Roles", customers: "Customers", orders: "Orders" };

  return (
    <div className="flex flex-col gap-6">
      <StaffTabs />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-paper-dim">
            <Img src={user.image} alt={user.name ?? user.email} seedFallback={user.id} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl">{user.name ?? user.email}</h1>
              <Badge tone={STATUS_TONE[user.status] ?? "outline"}>{user.status}</Badge>
            </div>
            <p className="text-sm text-ink-soft">{user.email}</p>
            <p className="text-xs text-ink-soft">
              {user.employeeId ?? "No employee ID"} · {user.jobTitle ?? "No title"} {user.department ? `· ${user.department}` : ""}
            </p>
          </div>
        </div>
        <ProfileActions userId={user.id} name={user.name ?? user.email} status={user.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="border border-line p-5">
            <h2 className="font-display text-lg">Activity Timeline</h2>
            <p className="mt-1 text-xs text-ink-soft">
              {totalActions} total action{totalActions === 1 ? "" : "s"} recorded
              {moduleCounts.length > 0 && (
                <> — {moduleCounts.map((m) => `${moduleLabel[m.module] ?? m.module}: ${m._count}`).join(", ")}</>
              )}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {activity.length === 0 && <li className="text-sm text-ink-soft">No activity recorded yet.</li>}
              {activity.map((a) => (
                <li key={a.id} className="border border-line bg-paper-dim p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{a.createdAt.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {moduleLabel[a.module] ?? a.module}
                    {a.entityType && ` · ${a.entityType}${a.entityId ? ` ${a.entityId}` : ""}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-line p-5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg">Login &amp; Security History</h2>
              {suspiciousUserIds.has(user.id) && <Badge tone="sale">Suspicious activity</Badge>}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {logins.length === 0 && <li className="text-sm text-ink-soft">No login history recorded yet.</li>}
              {logins.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 border-b border-line pb-2 text-sm last:border-0 last:pb-0">
                  <span className="flex items-center gap-2">
                    <Badge tone={l.event === "LOGIN_FAILED" ? "warning" : l.event === "LOGOUT" ? "outline" : "success"}>
                      {l.event.replace("LOGIN_", "")}
                    </Badge>
                    <span className="text-xs text-ink-soft">{formatUserAgent(l.userAgent)}</span>
                    {l.ipAddress && <span className="text-xs text-ink-soft">· {l.ipAddress}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">{l.createdAt.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-line p-5">
            <h2 className="font-display text-lg">Permission Overrides</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Checked permissions are what this account can actually do — from its role plus any overrides below.
            </p>
            <div className="mt-3">
              <PermissionOverridesEditor
                userId={user.id}
                rolePermissions={user.staffRole?.permissions ?? []}
                initialOverrides={user.permissionOverrides}
                initialRevocations={user.permissionRevocations}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-line p-5">
            <h2 className="font-display text-lg">Account Info</h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Role</dt>
                <dd className="mt-1">
                  {user.staffRole ? (
                    <StaffRoleSelect userId={user.id} staffRoleId={user.staffRole.id} roles={roles} />
                  ) : (
                    user.role.replace(/_/g, " ")
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Created</dt>
                <dd className="mt-1">
                  {user.createdAt.toLocaleString("en-IN")}
                  {user.createdBy && <> by {user.createdBy.name ?? user.createdBy.email}</>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Last Active</dt>
                <dd className="mt-1">{user.lastActiveAt ? user.lastActiveAt.toLocaleString("en-IN") : "Never"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Password Last Changed</dt>
                <dd className="mt-1">{user.passwordChangedAt ? user.passwordChangedAt.toLocaleString("en-IN") : "Never (original password)"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Effective Permissions</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {effectivePermissions.length === 0 && <span className="text-ink-soft">None</span>}
                  {effectivePermissions.slice(0, 6).map((key) => (
                    <Badge key={key} tone="outline">
                      {permissionLabel(key)}
                    </Badge>
                  ))}
                  {effectivePermissions.length > 6 && <span className="text-xs text-ink-soft">+{effectivePermissions.length - 6} more</span>}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border border-line p-5">
            <h2 className="font-display text-lg">Personal Information</h2>
            <div className="mt-3">
              <EditStaffProfileForm
                userId={user.id}
                initial={{
                  name: user.name ?? "",
                  phone: user.phone ?? "",
                  department: user.department ?? "",
                  jobTitle: user.jobTitle ?? "",
                  image: user.image,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
