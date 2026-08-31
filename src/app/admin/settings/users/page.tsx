import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { UserRoleSelect } from "./UserRoleSelect";
import { CreateStaffForm } from "./CreateStaffForm";

export const metadata = { title: "Staff & Roles" };

export default async function StaffUsersPage() {
  const users = await db.user.findMany({
    where: { role: { not: "CUSTOMER" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Staff &amp; Roles</h1>
      <p className="max-w-2xl text-sm text-ink-soft">
        Financial data (revenue, costs, margins, the ledger) is only visible to Super Admin, Business Owner, and
        Finance roles. Inventory Manager can also view and receive Purchase Orders. Everyone else sees the
        non-financial parts of the admin panel.
      </p>

      <CreateStaffForm />

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Since</Th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && <EmptyRow colSpan={4}>No staff accounts yet.</EmptyRow>}
          {users.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium">{u.name ?? "—"}</Td>
              <Td>{u.email}</Td>
              <Td>
                <UserRoleSelect userId={u.id} role={u.role} />
              </Td>
              <Td>{u.createdAt.toLocaleDateString("en-IN")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
