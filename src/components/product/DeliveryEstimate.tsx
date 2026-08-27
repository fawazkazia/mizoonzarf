"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Pencil, X } from "lucide-react";
import { AddressAutocomplete } from "@/components/checkout/AddressAutocomplete";
import { useClickOutside } from "@/hooks/useClickOutside";
import { estimateDeliveryRange, formatDeliveryRange } from "@/lib/delivery";
import type { StructuredAddress } from "@/lib/geo/provider";

const STORAGE_KEY = "ml_delivery_location";

type Location = { city: string; state: string; country: string };

function readStoredLocation(): Location | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Location) : null;
  } catch {
    return null;
  }
}

export function DeliveryEstimate({
  defaultAddress,
  inStock,
  processingDays,
  standardDaysText,
}: {
  defaultAddress: Location | null;
  inStock: boolean;
  processingDays: number;
  standardDaysText: string;
}) {
  const [location, setLocation] = useState<Location | null>(defaultAddress);
  const [editing, setEditing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!defaultAddress) setLocation(readStoredLocation());
  }, [defaultAddress]);

  useClickOutside(rootRef, () => setEditing(false), editing);

  function handleResolved(address: StructuredAddress) {
    const next: Location = { city: address.city, state: address.state, country: address.country };
    setLocation(next);
    setEditing(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Browser storage unavailable — location still updates for this render.
    }
  }

  const { min, max } = inStock
    ? estimateDeliveryRange({ processingDays, rangeText: standardDaysText, from: new Date() })
    : { min: null, max: null };

  return (
    <div
      ref={rootRef}
      className="relative flex items-center justify-between gap-2.5 rounded-xl border border-line/60 bg-paper-raise px-3 py-2 text-xs shadow-[var(--shadow-panel)]"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
          <MapPin size={13} />
        </span>
        <div>
          {!inStock ? (
            <p className="font-medium text-ink">Currently unavailable</p>
          ) : location ? (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="font-medium text-ink">
                Delivery to {location.city}
                {location.state ? `, ${location.state}` : ""}
              </span>
              {min && max && (
                <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-paper">
                  Est. Delivery: {formatDeliveryRange(min, max)}
                </span>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="link-reveal font-medium text-ink">
              Enter your delivery location
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        aria-label="Edit delivery location"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-paper transition-colors hover:border-ink hover:bg-paper-dim"
      >
        <Pencil size={12} />
      </button>

      {editing && (
        <div className="absolute right-0 top-full z-20 mt-2 w-full min-w-[280px] rounded-2xl border border-line/60 bg-paper-raise p-4 shadow-[var(--shadow-lift)] sm:w-96">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Delivery Location</p>
            <button onClick={() => setEditing(false)} aria-label="Close" className="text-ink-soft hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <AddressAutocomplete onResolved={handleResolved} />
        </div>
      )}
    </div>
  );
}
