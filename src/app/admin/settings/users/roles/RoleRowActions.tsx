"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteStaffRole } from "./actions";

export function RoleRowActions({ roleId, name, isSystem, staffCount }: { roleId: string; name: string; isSystem: boolean; staffCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (isSystem) return;
    if (staffCount > 0) {
      toast.error(`Reassign the ${staffCount} staff member(s) using "${name}" before deleting it.`);
      return;
    }
    if (!confirm(`Delete the "${name}" role? This can't be undone.`)) return;
    setLoading(true);
    try {
      await deleteStaffRole(roleId);
      toast.success("Role deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this role.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-3 text-ink-soft">
      <Link href={`/admin/settings/users/roles/${roleId}/edit`} aria-label="Edit" title="Edit" className="hover:text-ink">
        <Pencil size={15} />
      </Link>
      {!isSystem && (
        <button onClick={handleDelete} disabled={loading} aria-label="Delete" title="Delete" className="hover:text-sale">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
