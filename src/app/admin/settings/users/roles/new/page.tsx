import { StaffTabs } from "../../StaffTabs";
import { RoleForm } from "../RoleForm";

export const metadata = { title: "New Role" };

export default function NewRolePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">New Role</h1>
      <StaffTabs />
      <RoleForm initial={{ name: "", description: "", permissions: [] }} />
    </div>
  );
}
