"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { scorePasswordStrength, PASSWORD_STRENGTH_META, type PasswordStrength } from "@/lib/password-strength";

const STRENGTH_COLOR: Record<PasswordStrength, string> = { weak: "bg-sale", fair: "bg-gold", strong: "bg-success" };

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [checking, setChecking] = useState(() => Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(() => (token ? null : "This reset link is missing its token."));

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) setTokenError(data.error ?? "This reset link is invalid.");
      })
      .catch(() => setTokenError("Couldn't verify this reset link. Please try again."))
      .finally(() => setChecking(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Couldn't reset your password. Please try again.");
      return;
    }

    setSuccess(true);
  }

  if (checking) {
    return (
      <Container className="mx-auto max-w-md py-20 text-center">
        <p className="text-sm text-ink-soft">Verifying reset link...</p>
      </Container>
    );
  }

  if (tokenError) {
    return (
      <Container className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-4xl">Reset Link Invalid</h1>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">{tokenError}</p>
        <Link href="/forgot-password" className="mt-10 inline-block">
          <Button size="lg">Request a New Link</Button>
        </Link>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-4xl">Password Reset</h1>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          Your password has been successfully reset. You can now log in.
        </p>
        <Link href="/login" className="mt-10 inline-block">
          <Button size="lg">Return to Login</Button>
        </Link>
      </Container>
    );
  }

  const strength = password ? scorePasswordStrength(password) : null;

  return (
    <Container className="mx-auto max-w-md py-20">
      <h1 className="text-center font-display text-4xl">Reset Password</h1>
      <p className="mt-4 text-center text-sm text-ink-soft">Choose a new password for your account.</p>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-line px-4 py-3 pr-20 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wide text-ink-soft underline"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {strength && (
          <div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-paper-dim">
              <div className={`h-full rounded-full transition-all ${STRENGTH_COLOR[strength]} ${PASSWORD_STRENGTH_META[strength].width}`} />
            </div>
            <p className="mt-1 text-xs text-ink-soft">Password strength: {PASSWORD_STRENGTH_META[strength].label}</p>
          </div>
        )}

        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="border border-line px-4 py-3 text-sm"
        />

        <p className="text-xs text-ink-soft">Must be at least 8 characters, with an uppercase letter, a lowercase letter, and a number.</p>

        {error && <p className="text-sm text-sale">{error}</p>}

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </Container>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
