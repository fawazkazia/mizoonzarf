"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Container className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-4xl">Check Your Email</h1>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          If an account exists with this email, you will receive password reset instructions.
        </p>
        <Link href="/login" className="mt-10 inline-block">
          <Button size="lg">Return to Login</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="mx-auto max-w-md py-20">
      <h1 className="text-center font-display text-4xl">Forgot Password</h1>
      <p className="mt-4 text-center text-sm text-ink-soft">Enter the email address on your account and we&apos;ll send you a reset link.</p>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="border border-line px-4 py-3 text-sm"
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Remembered your password?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </Container>
  );
}
