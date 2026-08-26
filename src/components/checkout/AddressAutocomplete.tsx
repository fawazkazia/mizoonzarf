"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useDebouncedValue } from "@/hooks/useDebounce";
import type { StructuredAddress } from "@/lib/geo/provider";

interface Suggestion {
  placeId: string;
  description: string;
}

function newSessionToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function AddressAutocomplete({ onResolved }: { onResolved: (address: StructuredAddress) => void }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const sessionToken = useRef(newSessionToken());
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    fetch("/api/geo/config")
      .then((res) => res.json())
      .then((data) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (!configured || debouncedQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    fetch(`/api/geo/autocomplete?q=${encodeURIComponent(debouncedQuery)}&sessionToken=${sessionToken.current}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [configured, debouncedQuery]);

  useClickOutside(rootRef, () => setOpen(false), open);

  async function selectSuggestion(s: Suggestion) {
    setResolving(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/geo/place?placeId=${encodeURIComponent(s.placeId)}&sessionToken=${sessionToken.current}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't look up that address.");
      onResolved(data.address);
      setQuery("");
      sessionToken.current = newSessionToken();
    } catch {
      setLocationError("We couldn't load that address. Please try another or enter it manually below.");
    } finally {
      setResolving(false);
    }
  }

  function useCurrentLocation() {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support location detection. Please enter your address manually.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/geo/reverse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Couldn't determine your address.");
          onResolved(data.address);
        } catch {
          setLocationError("We couldn't determine your address from your location. Please enter it manually below.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. No problem — just enter your address manually below."
            : "We couldn't detect your location. Please enter your address manually below."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (configured === null || configured === false) return null;

  return (
    <div className="mb-5 flex flex-col gap-2">
      <div ref={rootRef} className="relative">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search for your address"
            aria-label="Search for your address"
            className="min-h-[44px] w-full border border-line bg-paper py-2.5 pl-9 pr-9 text-sm outline-none focus:border-ink"
          />
          {(searching || resolving) && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-mute" />
          )}
        </div>

        {open && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full z-20 mt-1 w-full max-h-72 overflow-y-auto border border-line bg-paper shadow-lg">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="flex min-h-[44px] w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-paper-dim"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-ink-mute" />
                  <span>{s.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className={cn(
          "flex min-h-[44px] w-fit items-center gap-2 border border-line px-4 text-xs uppercase tracking-[0.1em] text-ink-soft hover:border-ink hover:text-ink disabled:opacity-60"
        )}
      >
        {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
        {locating ? "Detecting your location..." : "Use My Current Location"}
      </button>

      {locationError && <p className="text-xs text-sale">{locationError}</p>}
    </div>
  );
}
