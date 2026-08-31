"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Fieldset } from "@/components/admin/FormField";
import { scorePasswordStrength, PASSWORD_STRENGTH_META, type PasswordStrength } from "@/lib/password-strength";
import { changeOwnPassword } from "@/app/admin/profile/actions";

const STRENGTH_COLOR: Record<PasswordStrength, string> = { weak: "bg-sale", fair: "bg-gold", strong: "bg-success" };

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = newPassword ? scorePasswordStrength(newPassword) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await changeOwnPassword({ currentPassword, newPassword, confirmPassword });
      toast.success("Password changed. Please sign in again.");
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change your password.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Fieldset title="Change Password">
        <Field label="Current Password">
          <Input
            required
            type={showPasswords ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <div />

        <Field label="New Password">
          <Input
            required
            minLength={8}
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm New Password">
          <Input
            required
            minLength={8}
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        {strength && (
          <div className="sm:col-span-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-paper-dim">
              <div className={`h-full rounded-full transition-all ${STRENGTH_COLOR[strength]} ${PASSWORD_STRENGTH_META[strength].width}`} />
            </div>
            <p className="mt-1 text-xs text-ink-soft">Password strength: {PASSWORD_STRENGTH_META[strength].label}</p>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-ink-soft sm:col-span-2">
          <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
          Show passwords
        </label>
      </Fieldset>
      <p className="mt-2 text-xs text-ink-soft">
        Must be at least 8 characters, with an uppercase letter, a lowercase letter, and a number. Changing your password
        signs you out of all devices, including this one.
      </p>
      <Button type="submit" size="sm" disabled={loading} className="mt-4">
        {loading ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}
