"use client";

import { useSettings } from "@/components/SettingsContext";
import { useDisplayCurrencyStore } from "@/stores/display-currency-store";

export interface DisplayPrice {
  price: number;
  compareAt: number | null;
  symbol: string;
  isConverted: boolean;
}

/**
 * Converts a base-currency (stored/charged) amount into the shopper's chosen
 * display currency, purely for presentation. Never use this for anything
 * that feeds back into a filter, cart, or checkout — those must stay in the
 * real base currency the backend actually queries/charges in.
 */
export function useDisplayPrice(baseAmount: number, baseCompareAt: number | null = null): DisplayPrice {
  const settings = useSettings();
  const code = useDisplayCurrencyStore((s) => s.code);

  if (!settings.currencyDisplay.enabled || !code || code === settings.currency) {
    return { price: baseAmount, compareAt: baseCompareAt, symbol: settings.currencySymbol, isConverted: false };
  }

  const option = settings.currencyDisplay.options.find((o) => o.code === code);
  if (!option) {
    return { price: baseAmount, compareAt: baseCompareAt, symbol: settings.currencySymbol, isConverted: false };
  }

  return {
    price: baseAmount * option.rate,
    compareAt: baseCompareAt !== null ? baseCompareAt * option.rate : null,
    symbol: option.symbol,
    isConverted: true,
  };
}
