"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getEmailNotificationDef } from "@/lib/notifications/catalog";
import { retryFailedEmail } from "./actions";

export interface LogRow {
  id: string;
  toEmail: string;
  customerName: string | null;
  orderNumber: string | null;
  notificationType: string;
  subject: string;
  status: "SENT" | "FAILED";
  errorMessage: string | null;
  isTest: boolean;
  retryCount: number;
  createdAt: string;
}

function RetryButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    setLoading(true);
    try {
      await retryFailedEmail(id);
      toast.success("Email resent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleRetry} disabled={loading}>
      {loading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
      Retry
    </Button>
  );
}

export function HistoryTab({ initial }: { initial: LogRow[] }) {
  if (initial.length === 0) {
    return <p className="text-sm text-ink-soft">No emails have been sent yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-line bg-paper text-xs uppercase tracking-[0.06em] text-ink-soft">
          <tr>
            <th className="px-4 py-3">Sent</th>
            <th className="px-4 py-3">Customer / Email</th>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Retry</th>
          </tr>
        </thead>
        <tbody>
          {initial.map((row) => (
            <tr key={row.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-soft">{new Date(row.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className="px-4 py-3">
                <p className="text-ink">{row.customerName ?? "Guest"}</p>
                <p className="text-xs text-ink-soft">{row.toEmail}</p>
              </td>
              <td className="px-4 py-3 text-xs">{row.orderNumber ?? "—"}</td>
              <td className="px-4 py-3 text-xs">
                {getEmailNotificationDef(row.notificationType)?.label ?? row.notificationType}
                {row.isTest && <span className="ml-1.5 rounded-full bg-paper px-2 py-0.5 text-[10px] uppercase text-ink-soft">Test</span>}
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 text-xs" title={row.subject}>
                {row.subject}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    row.status === "SENT"
                      ? "rounded-full bg-[#e7f0ea] px-2.5 py-1 text-[11px] font-semibold text-[#3f6b4c]"
                      : "rounded-full bg-[#f6e6e4] px-2.5 py-1 text-[11px] font-semibold text-[#a3372f]"
                  }
                >
                  {row.status}
                </span>
                {row.errorMessage && (
                  <p className="mt-1 max-w-[200px] text-[11px] text-[#a3372f]" title={row.errorMessage}>
                    {row.errorMessage}
                  </p>
                )}
                {row.retryCount > 0 && <p className="mt-1 text-[10px] text-ink-soft">Retried {row.retryCount}x</p>}
              </td>
              <td className="px-4 py-3">{row.status === "FAILED" && <RetryButton id={row.id} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
