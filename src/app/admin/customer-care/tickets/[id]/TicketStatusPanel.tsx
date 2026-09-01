"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/admin/FormField";
import { updateTicketStatus, updateTicketPriority } from "./actions";
import { TICKET_STATUS_TRANSITIONS, TICKET_STATUS_LABEL, ALL_TICKET_PRIORITIES, TICKET_PRIORITY_LABEL } from "@/lib/customer-care/status";
import type { TicketStatus, TicketPriority } from "@/generated/prisma/client";

export function TicketStatusPanel({
  ticketId,
  currentStatus,
  currentPriority,
  resolvedAt,
  resolvedByName,
  closedAt,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
  currentPriority: TicketPriority;
  resolvedAt: Date | null;
  resolvedByName: string | null;
  closedAt: Date | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [loading, setLoading] = useState(false);

  const options = [currentStatus, ...TICKET_STATUS_TRANSITIONS[currentStatus].filter((s) => s !== currentStatus)];

  async function handleStatusChange(next: TicketStatus) {
    setStatus(next);
    setLoading(true);
    try {
      await updateTicketStatus(ticketId, next);
      toast.success("Status updated.");
      router.refresh();
    } catch (err) {
      setStatus(currentStatus);
      toast.error(err instanceof Error ? err.message : "Couldn't update status.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePriorityChange(next: TicketPriority) {
    setPriority(next);
    setLoading(true);
    try {
      await updateTicketPriority(ticketId, next);
      toast.success("Priority updated.");
      router.refresh();
    } catch (err) {
      setPriority(currentPriority);
      toast.error(err instanceof Error ? err.message : "Couldn't update priority.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-line p-5">
      <h2 className="mb-3 font-display text-lg">Status &amp; Priority</h2>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.08em] text-ink-soft">Status</span>
          <Select value={status} disabled={loading} onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}>
            {options.map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.08em] text-ink-soft">Priority</span>
          <Select value={priority} disabled={loading} onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}>
            {ALL_TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TICKET_PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </label>
        {resolvedAt && (
          <p className="text-xs text-ink-soft">
            Resolved {resolvedAt.toLocaleString()} {resolvedByName && `by ${resolvedByName}`}
          </p>
        )}
        {closedAt && <p className="text-xs text-ink-soft">Closed {closedAt.toLocaleString()}</p>}
      </div>
    </div>
  );
}
