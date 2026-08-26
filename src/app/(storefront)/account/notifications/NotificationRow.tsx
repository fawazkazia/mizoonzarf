"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { markAsRead } from "./actions";

export function NotificationRow({
  id,
  title,
  body,
  link,
  isRead,
  createdAt,
}: {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}) {
  const content = (
    <div className={cn("flex flex-col gap-1 border-b border-line py-4 last:border-0", !isRead && "bg-paper-dim px-3")}>
      <div className="flex items-center gap-2">
        {!isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />}
        <p className={cn("text-sm", !isRead && "font-semibold")}>{title}</p>
      </div>
      <p className="text-sm text-ink-soft">{body}</p>
      <p className="text-xs text-ink-soft/70">{createdAt}</p>
    </div>
  );

  function handleClick() {
    if (!isRead) void markAsRead(id);
  }

  if (link) {
    return (
      <Link href={link} onClick={handleClick} className="block hover:opacity-80">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className="block w-full text-left">
      {content}
    </button>
  );
}
