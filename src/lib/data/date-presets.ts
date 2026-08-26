export interface AnalyticsRange {
  from: Date;
  to: Date;
}

export const DATE_PRESETS = ["today", "7d", "30d", "90d", "this_month", "last_month"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  this_month: "This Month",
  last_month: "Last Month",
};

export function resolvePresetRange(preset: DatePreset): AnalyticsRange {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (preset === "today") return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: endOfToday };
  if (preset === "7d") return { from: new Date(now.getTime() - 6 * 86_400_000), to: endOfToday };
  if (preset === "30d") return { from: new Date(now.getTime() - 29 * 86_400_000), to: endOfToday };
  if (preset === "90d") return { from: new Date(now.getTime() - 89 * 86_400_000), to: endOfToday };
  if (preset === "this_month") return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday };
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from, to };
}
