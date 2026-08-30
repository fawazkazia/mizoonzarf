"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Checkbox } from "@/components/admin/FormField";
import { Modal } from "@/components/ui/Modal";
import { upsertEmailTemplate, previewEmailTemplate, sendTestEmail } from "./actions";

export interface TemplateRow {
  key: string;
  label: string;
  description: string;
  group: "order" | "return" | "tracking";
  isActive: boolean;
  subject: string;
  body: string;
}

const GROUP_LABELS: Record<TemplateRow["group"], string> = { order: "Order Updates", return: "Returns & Refunds", tracking: "Tracking" };

function TemplateCard({ initial }: { initial: TemplateRow }) {
  const [isActive, setIsActive] = useState(initial.isActive);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await upsertEmailTemplate({ key: initial.key, isActive, subject, body });
      toast.success(`${initial.label} saved.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    try {
      const html = await previewEmailTemplate({ key: initial.key, subject, body });
      setPreviewHtml(html);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to render preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail.trim()) {
      toast.error("Enter an email address to send the test to.");
      return;
    }
    setSendingTest(true);
    try {
      await sendTestEmail({ key: initial.key, to: testEmail.trim(), subject, body });
      toast.success(`Test email sent to ${testEmail.trim()}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test email.");
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-paper-raise p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-ink">{initial.label}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{initial.description}</p>
        </div>
        <Checkbox label="Enabled" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="Subject" hint="Supports {{variables}} — e.g. {{customer_name}}, {{order_number}}">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Body">
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={handlePreview} disabled={previewLoading}>
          {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          Preview
        </Button>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="test@email.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-48 py-2 text-xs"
          />
          <Button size="sm" variant="secondary" onClick={handleSendTest} disabled={sendingTest}>
            {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send Test
          </Button>
        </div>
      </div>

      <Modal open={previewHtml !== null} onClose={() => setPreviewHtml(null)} ariaLabel={`Preview: ${initial.label}`} panelClassName="max-w-3xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-sm font-medium">{initial.label} — Preview</p>
          <button onClick={() => setPreviewHtml(null)} className="text-xs text-ink-soft hover:text-ink">
            Close
          </button>
        </div>
        {previewHtml && <iframe title="Email preview" srcDoc={previewHtml} className="h-[70vh] w-full border-0" />}
      </Modal>
    </div>
  );
}

export function TemplatesTab({ initial }: { initial: TemplateRow[] }) {
  const groups = (["order", "return", "tracking"] as const).map((g) => ({ group: g, items: initial.filter((t) => t.group === g) }));

  return (
    <div className="flex flex-col gap-8">
      {groups.map(
        ({ group, items }) =>
          items.length > 0 && (
            <div key={group}>
              <h2 className="font-display text-lg">{GROUP_LABELS[group]}</h2>
              <div className="mt-3 flex flex-col gap-4">
                {items.map((item) => (
                  <TemplateCard key={item.key} initial={item} />
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
