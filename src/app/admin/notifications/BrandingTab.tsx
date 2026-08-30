"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Fieldset } from "@/components/admin/FormField";
import { updateEmailBrandingSettings } from "./actions";
import type { SiteSettings } from "@/lib/settings";

export function BrandingTab({ initial }: { initial: SiteSettings["email"] }) {
  const [senderName, setSenderName] = useState(initial.senderName);
  const [fromEmailOverride, setFromEmailOverride] = useState(initial.fromEmailOverride);
  const [replyToEmail, setReplyToEmail] = useState(initial.replyToEmail);
  const [footerNote, setFooterNote] = useState(initial.footerNote);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateEmailBrandingSettings({ senderName, fromEmailOverride, replyToEmail, footerNote });
      toast.success("Email settings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Fieldset title="Sender">
        <Field label="Sender Name" hint="Shown as the 'From' display name on every email.">
          <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
        </Field>
        <Field label="From Email Override" hint="Optional — must be on a domain verified with the email provider, otherwise the server default is used.">
          <Input type="email" value={fromEmailOverride} onChange={(e) => setFromEmailOverride(e.target.value)} placeholder="orders@mizoonzarf.in" />
        </Field>
        <Field label="Reply-To Email" hint="Optional — falls back to the Support Email set in Settings.">
          <Input type="email" value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)} placeholder="support@mizoonzarf.in" />
        </Field>
      </Fieldset>
      <Fieldset title="Footer">
        <div className="sm:col-span-2">
          <Field label="Extra Footer Note" hint="Appended to the footer of every email, below the support contact and address (both set in Settings).">
            <Textarea rows={3} value={footerNote} onChange={(e) => setFooterNote(e.target.value)} />
          </Field>
        </div>
      </Fieldset>
      <p className="text-xs text-ink-soft">
        Logo, support email/phone, and business address are managed on the main{" "}
        <Link href="/admin/settings" className="underline">
          Settings
        </Link>{" "}
        page and are reused automatically in every email.
      </p>
      <div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Email Settings"}
        </Button>
      </div>
    </div>
  );
}
