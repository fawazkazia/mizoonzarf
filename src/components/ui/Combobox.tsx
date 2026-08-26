"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface ComboboxItem {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  keywords?: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: string;
  "aria-label": string;
  /** Compact display for the closed trigger — falls back to the selected item's icon+label. */
  renderTrigger?: (item: ComboboxItem | undefined) => React.ReactNode;
  triggerClassName?: string;
  /** Id on the trigger button — lets callers like focusFirstInvalidField() target this field with document.getElementById(). */
  triggerId?: string;
}

/** Generic searchable single-select dropdown used for country, state, and phone country-code pickers. */
export function Combobox({
  items,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled,
  error,
  "aria-label": ariaLabel,
  renderTrigger,
  triggerClassName,
  triggerId,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = items.find((i) => i.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.sublabel ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  useClickOutside(rootRef, close, open);

  function openPanel() {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(Math.max(0, filtered.findIndex((i) => i.value === value)));
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function select(item: ComboboxItem) {
    onChange(item.value);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) select(item);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openPanel())}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-between gap-2 border bg-paper px-3 py-2.5 text-left text-sm outline-none",
          error ? "border-sale" : "border-line focus:border-ink",
          disabled && "cursor-not-allowed opacity-50",
          triggerClassName
        )}
      >
        {renderTrigger ? (
          renderTrigger(selected)
        ) : selected ? (
          <span className="flex items-center gap-2 truncate">
            {selected.icon}
            <span className="truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="truncate text-ink-mute">{placeholder}</span>
        )}
        <ChevronDown size={16} className="shrink-0 text-ink-mute" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full min-w-[260px] border border-line bg-paper shadow-lg">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full border-b border-line px-3 py-2.5 text-sm outline-none"
          />
          <ul role="listbox" id={listId} className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-3 text-sm text-ink-mute">{emptyMessage}</li>}
            {filtered.map((item, index) => (
              <li key={item.value} role="option" aria-selected={item.value === value}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(item)}
                  className={cn(
                    "flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-sm",
                    index === activeIndex ? "bg-paper-dim" : "hover:bg-paper-dim"
                  )}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.sublabel && <span className="shrink-0 text-ink-mute">{item.sublabel}</span>}
                  {item.value === value && <Check size={14} className="shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
