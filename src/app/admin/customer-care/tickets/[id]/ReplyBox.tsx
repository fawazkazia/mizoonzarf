"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea, Select } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { replyToTicket, addInternalNote } from "./actions";

type Tab = "reply" | "note";

export function ReplyBox({
  ticketId,
  templates,
  hasPhone,
  hasEmail,
}: {
  ticketId: string;
  templates: { id: string; name: string; body: string }[];
  hasPhone: boolean;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reply");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "WHATSAPP">(hasEmail ? "EMAIL" : "WHATSAPP");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) setBody(template.body);
  }

  async function handleSubmit() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      if (tab === "reply") {
        await replyToTicket(ticketId, { body, channel, attachments });
        toast.success("Reply sent.");
      } else {
        await addInternalNote(ticketId, body, attachments);
        toast.success("Internal note added.");
      }
      setBody("");
      setAttachments([]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-line p-5">
      <div className="mb-4 flex gap-4 border-b border-line">
        <button
          type="button"
          onClick={() => setTab("reply")}
          className={`border-b-2 pb-2 text-xs uppercase tracking-wide ${tab === "reply" ? "border-ink text-ink" : "border-transparent text-ink-soft"}`}
        >
          Reply to Customer
        </button>
        <button
          type="button"
          onClick={() => setTab("note")}
          className={`border-b-2 pb-2 text-xs uppercase tracking-wide ${tab === "note" ? "border-ink text-ink" : "border-transparent text-ink-soft"}`}
        >
          Internal Note
        </button>
      </div>

      {tab === "reply" && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Select value={channel} onChange={(e) => setChannel(e.target.value as "EMAIL" | "WHATSAPP")} className="!w-auto">
            <option value="EMAIL" disabled={!hasEmail}>
              Email {!hasEmail && "(no email on file)"}
            </option>
            <option value="WHATSAPP" disabled={!hasPhone}>
              WhatsApp {!hasPhone && "(no phone on file)"}
            </option>
          </Select>
          {templates.length > 0 && (
            <Select defaultValue="" onChange={(e) => applyTemplate(e.target.value)} className="!w-auto">
              <option value="">Insert template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      <Textarea
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={tab === "reply" ? "Write a reply to the customer..." : "Note visible only to staff..."}
        className="w-full"
      />

      <div className="mt-3">
        <ImageUploader images={attachments} onChange={setAttachments} max={6} />
      </div>

      <Button size="sm" onClick={handleSubmit} disabled={loading || !body.trim()} className="mt-3">
        {loading ? "Sending..." : tab === "reply" ? "Send Reply" : "Add Note"}
      </Button>
    </div>
  );
}
