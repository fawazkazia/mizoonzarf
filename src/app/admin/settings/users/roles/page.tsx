import Link from "next/link";
import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { StaffTabs } from "../StaffTabs";
import { RoleRowActions } from "./RoleRowActions";
import { SyncSystemRolesButton } from "./SyncSystemRolesButton";

export const metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  const roles = await db.staffRole.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Staff &amp; Roles</h1>
          <p className="mt-1 text-sm text-ink-soft">Create unlimited custom roles with granular permissions.</p>
        </div>
        <div className="flex gap-2">
          <SyncSystemRolesButton />
          <ButtonLink href="/admin/settings/users/roles/new" size="sm">
            + New Role
          </ButtonLink>
        </div>
      </div>

      <StaffTabs />

      <Table>
        <thead>
          <tr>
            <Th>Role</Th>
            <Th>Description</Th>
            <Th>Staff Assigned</Th>
            <Th>Permissions</Th>
            <Th>Created</Th>
            <Th>Type</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 && <EmptyRow colSpan={7}>No roles yet.</EmptyRow>}
          {roles.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium">
                <Link href={`/admin/settings/users/roles/${r.id}/edit`} className="hover:underline">
                  {r.name}
                </Link>
              </Td>
              <Td className="max-w-xs truncate text-ink-soft">{r.description ?? "—"}</Td>
              <Td>
                <Link href={`/admin/settings/users?role=${r.id}`} className="hover:underline">
                  {r._count.users}
                </Link>
              </Td>
              <Td>{r.permissions.length}</Td>
              <Td className="text-xs text-ink-soft">{r.createdAt.toLocaleDateString("en-IN")}</Td>
              <Td>
                <Badge tone={r.isSystem ? "outline" : "gold"}>{r.isSystem ? "System" : "Custom"}</Badge>
              </Td>
              <Td className="text-right">
                <RoleRowActions roleId={r.id} name={r.name} isSystem={r.isSystem} staffCount={r._count.users} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
