"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/admin/FormField";
import { addCustomerNote } from "../actions";

export interface CustomerNoteRow {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
}

/** Timestamped, append-only — every entry stays forever, never edited or overwritten. */
export function CustomerNotesLog({ userId, notes }: { userId: string; notes: CustomerNoteRow[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      await addCustomerNote(userId, body);
      setBody("");
      toast.success("Note added.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add note.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="e.g. Customer called regarding delayed delivery. Courier contacted, customer informed delivery will arrive tomorrow."
      />
      <Button size="sm" onClick={handleAdd} disabled={loading || !body.trim()} className="self-start">
        {loading ? "Adding..." : "Add Note"}
      </Button>

      {notes.length === 0 ? (
        <p className="text-sm text-ink-soft">No internal notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3 border-t border-line pt-3">
          {notes.map((n) => (
            <li key={n.id} className="border border-line bg-paper-dim p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1.5 text-xs text-ink-soft">
                {n.authorName} · {n.createdAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
