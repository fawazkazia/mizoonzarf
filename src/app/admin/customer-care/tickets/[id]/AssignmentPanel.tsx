"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/admin/FormField";
import { assignTicket } from "./actions";

export function AssignmentPanel({
  ticketId,
  currentAssigneeId,
  staff,
  canAssign,
}: {
  ticketId: string;
  currentAssigneeId: string | null;
  staff: { id: string; name: string | null; email: string }[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? "");
  const [loading, setLoading] = useState(false);

  const currentName = staff.find((s) => s.id === currentAssigneeId)?.name ?? staff.find((s) => s.id === currentAssigneeId)?.email;

  async function handleChange(next: string) {
    setAssigneeId(next);
    setLoading(true);
    try {
      await assignTicket(ticketId, next || null);
      toast.success(next ? "Ticket assigned." : "Ticket unassigned.");
      router.refresh();
    } catch (err) {
      setAssigneeId(currentAssigneeId ?? "");
      toast.error(err instanceof Error ? err.message : "Couldn't update assignment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-line p-5">
      <h2 className="mb-3 font-display text-lg">Assignment</h2>
      {canAssign ? (
        <Select value={assigneeId} disabled={loading} onChange={(e) => handleChange(e.target.value)}>
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name ?? s.email}
            </option>
          ))}
        </Select>
      ) : (
        <p className="text-sm">{currentName ?? "Unassigned"}</p>
      )}
    </div>
  );
}
