"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TemplatesTab, type TemplateRow } from "./TemplatesTab";
import { BrandingTab } from "./BrandingTab";
import { HistoryTab, type LogRow } from "./HistoryTab";
import type { SiteSettings } from "@/lib/settings";

type Tab = "templates" | "branding" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "templates", label: "Templates" },
  { id: "branding", label: "Branding & Sender" },
  { id: "history", label: "History" },
];

export function NotificationsTabs({ templates, branding, logs }: { templates: TemplateRow[]; branding: SiteSettings["email"]; logs: LogRow[] }) {
  const [tab, setTab] = useState<Tab>("templates");

  return (
    <div>
      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-medium uppercase tracking-[0.08em] transition-colors",
              tab === t.id ? "border-b-2 border-ink text-ink" : "text-ink-soft hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "templates" && <TemplatesTab initial={templates} />}
        {tab === "branding" && <BrandingTab initial={branding} />}
        {tab === "history" && <HistoryTab initial={logs} />}
      </div>
    </div>
  );
}
