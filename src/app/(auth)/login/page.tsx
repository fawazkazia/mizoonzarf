"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      toast.error("Invalid email or password.");
      return;
    }

    await fetch("/api/cart/merge", { method: "POST" });
    await Promise.all([fetchCart(), fetchWishlist()]);
    toast.success("Welcome back.");
    router.push(searchParams.get("callbackUrl") ?? "/account/profile");
    router.refresh();
  }

  return (
    <Container className="mx-auto max-w-md py-20">
      <h1 className="text-center font-display text-4xl">Sign In</h1>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="border border-line px-4 py-3 text-sm"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border border-line px-4 py-3 text-sm"
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/register" className="underline">
          Create an account
        </Link>
      </p>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
