"use client";

import { useSettings } from "@/components/SettingsContext";
import { useDisplayCurrencyStore } from "@/stores/display-currency-store";

/**
 * Display-only — changes only how prices are *shown* while browsing.
 * Cart, checkout, and orders always charge in the store's real currency
 * (settings.currency), regardless of what's selected here.
 */
export function CurrencySwitcher() {
  const settings = useSettings();
  const code = useDisplayCurrencyStore((s) => s.code);
  const setCode = useDisplayCurrencyStore((s) => s.setCode);

  if (!settings.currencyDisplay.enabled || settings.currencyDisplay.options.length === 0) return null;

  return (
    <select
      value={code ?? settings.currency}
      onChange={(e) => setCode(e.target.value === settings.currency ? null : e.target.value)}
      aria-label="Display currency"
      className="cursor-pointer bg-transparent text-[10.5px] uppercase tracking-[0.18em] text-paper/85 outline-none"
    >
      <option value={settings.currency} className="text-ink">
        {settings.currency}
      </option>
      {settings.currencyDisplay.options.map((o) => (
        <option key={o.code} value={o.code} className="text-ink">
          {o.code}
        </option>
      ))}
    </select>
  );
}
