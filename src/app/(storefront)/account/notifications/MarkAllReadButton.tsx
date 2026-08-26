"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAllAsRead } from "./actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await markAllAsRead();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="text-xs uppercase tracking-[0.1em] underline disabled:opacity-40">
      Mark All as Read
    </button>
  );
}
