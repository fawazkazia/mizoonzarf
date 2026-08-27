"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sale transition-colors duration-[var(--dur-1)] hover:bg-sale/10"
    >
      <LogOut size={17} strokeWidth={1.75} />
      Sign Out
    </button>
  );
}
