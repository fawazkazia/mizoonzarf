"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useSettings } from "@/components/SettingsContext";
import { useDisplayCurrencyStore } from "@/stores/display-currency-store";
import { CountryFlag } from "@/components/ui/CountryFlag";

interface CountryOption {
  code: string;
  country: string;
  label: string;
}

/**
 * Country/currency picker for the header utility bar. Selecting an entry
 * swaps the flag + short label shown here and drives useDisplayCurrencyStore
 * — display-only: cart, checkout, and orders always charge in the store's
 * real currency (settings.currency), see useDisplayPrice.
 */
export function CountrySwitcher() {
  const settings = useSettings();
  const code = useDisplayCurrencyStore((s) => s.code);
  const setCode = useDisplayCurrencyStore((s) => s.setCode);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  /* The panel is portaled to <body> (see below) rather than rendered as a
   * normal absolute-positioned child, because this control lives inside the
   * header's promo strip, which is `overflow-hidden` (it needs that to
   * clip its collapse-on-scroll max-height animation) — an ordinary
   * absolute child would be sliced off at that box's edge. Portaling means
   * click-outside has to check both the trigger and the (now detached)
   * panel explicitly instead of relying on one contains() check. */
  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const options: CountryOption[] = useMemo(() => {
    const base: CountryOption = {
      code: settings.currency,
      country: settings.header.countryCode,
      label: settings.header.countryLabel,
    };
    if (!settings.currencyDisplay.enabled) return [base];
    return [
      base,
      ...settings.currencyDisplay.options.map((o) => ({ code: o.code, country: o.country, label: o.countryLabel })),
    ];
  }, [settings]);

  const selected = options.find((o) => o.code === (code ?? settings.currency)) ?? options[0];

  if (options.length <= 1) {
    return (
      <span className="flex items-center gap-1.5">
        <CountryFlag code={selected.country} title={selected.label} className="h-3 w-4 shrink-0 rounded-[1px]" />
        {selected.label.split(" ")[0]}
      </span>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select country and currency"
        className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-paper/85"
      >
        <CountryFlag code={selected.country} title={selected.label} className="h-3 w-4 shrink-0 rounded-[1px]" />
        <span className="truncate">{selected.label.split(" ")[0]}</span>
        <span aria-hidden="true" className="opacity-40">
          /
        </span>
        <span>{selected.code}</span>
        <ChevronDown size={11} className="shrink-0 opacity-70" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            aria-label="Country and currency"
            style={{ top: panelPos.top, right: panelPos.right }}
            className="fixed z-[var(--z-panel)] w-48 border border-line bg-paper py-1 normal-case tracking-normal text-ink shadow-lg"
          >
            {options.map((o) => (
              <li key={o.code} role="option" aria-selected={o.code === selected.code}>
                <button
                  type="button"
                  onClick={() => {
                    setCode(o.code === settings.currency ? null : o.code);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-paper-dim"
                >
                  <CountryFlag code={o.country} className="h-3 w-4 shrink-0 rounded-[1px]" />
                  <span className="flex-1 truncate">{o.label}</span>
                  <span className="shrink-0 text-ink-mute">{o.code}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}
