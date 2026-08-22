"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      toast.error(data.error ?? "Couldn't create your account.");
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (signInRes?.error) {
      toast.success("Account created — please sign in.");
      router.push("/login");
      return;
    }

    await fetch("/api/cart/merge", { method: "POST" });
    await Promise.all([fetchCart(), fetchWishlist()]);
    toast.success("Welcome to the family.");
    router.push("/account/profile");
    router.refresh();
  }

  return (
    <Container className="mx-auto max-w-md py-20">
      <h1 className="text-center font-display text-4xl">Create Account</h1>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="border border-line px-4 py-3 text-sm" />
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="border border-line px-4 py-3 text-sm" />
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 8 characters)" className="border border-line px-4 py-3 text-sm" />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </Container>
  );
}
