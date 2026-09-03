import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StaffTabs } from "../../../StaffTabs";
import { RoleForm } from "../../RoleForm";

export const metadata = { title: "Edit Role" };

const SUPER_ADMIN_ROLE_NAME = "Super Admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;
  const role = await db.staffRole.findUnique({ where: { id } });
  if (!role) notFound();

  const locked = role.isSystem && role.name === SUPER_ADMIN_ROLE_NAME;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Edit Role — {role.name}</h1>
      <StaffTabs />
      <RoleForm roleId={role.id} initial={{ name: role.name, description: role.description ?? "", permissions: role.permissions }} locked={locked} />
    </div>
  );
}
