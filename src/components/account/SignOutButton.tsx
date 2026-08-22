"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-6 text-xs uppercase tracking-[0.1em] text-sale underline">
      Sign Out
    </button>
  );
}
