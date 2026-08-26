"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
}

export type NavigableItem = { type: "recent" | "popular"; term: string } | { type: "product"; product: SuggestionProduct };

const RECENT_KEY = "recent_searches";

/**
 * Shared search-box behavior — autocomplete fetch, recent/popular searches,
 * keyboard nav, and voice search — used by both the desktop inline dropdown
 * (HeaderSearchBar) and the mobile full-screen overlay (SearchOverlay), so
 * neither drifts from the other.
 */
export function useSearchBox(active: boolean, onNavigate: () => void) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SuggestionProduct[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [recentVersion, setRecentVersion] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Starts false on both server and the client's first render (so hydration
  // matches), then flips post-mount if the browser actually supports it —
  // computing this via useMemo instead would read `window` during the
  // client's first render, before hydration reconciles, and mismatch the
  // server-rendered (button-less) markup.
  const [voiceSupported, setVoiceSupported] = useState(false);
  useEffect(() => {
    setVoiceSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  const recent = useMemo<string[]>(() => {
    if (!active) return [];
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, recentVersion]);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setProducts(data.products ?? []);
        setPopular(data.popular ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") throw err;
      }
    }, 200);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, active]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [query, active, recent.length, popular.length]);

  const navigableItems = useMemo<NavigableItem[]>(() => {
    if (query.length < 2) {
      return [
        ...recent.map((term): NavigableItem => ({ type: "recent", term })),
        ...popular.map((term): NavigableItem => ({ type: "popular", term })),
      ];
    }
    return products.map((product): NavigableItem => ({ type: "product", product }));
  }, [query, recent, popular, products]);

  function reset() {
    setQuery("");
    setProducts([]);
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    setRecentVersion((v) => v + 1);
  }

  function saveRecent(term: string) {
    if (!term.trim()) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecentVersion((v) => v + 1);
    fetch("/api/search/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term }),
    });
  }

  function goToSearch(term: string) {
    saveRecent(term);
    onNavigate();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function activateItem(item: NavigableItem) {
    if (item.type === "product") {
      saveRecent(query);
      onNavigate();
      router.push(`/product/${item.product.slug}`);
    } else {
      goToSearch(item.term);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, navigableItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const highlighted = highlightIndex >= 0 ? navigableItems[highlightIndex] : undefined;
      if (highlighted) activateItem(highlighted);
      else goToSearch(query);
    } else if (e.key === "Escape") {
      onNavigate();
    }
  }

  function toggleVoiceSearch() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setQuery(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return {
    query,
    setQuery,
    products,
    popular,
    recent,
    clearRecent,
    highlightIndex,
    setHighlightIndex,
    navigableItems,
    activateItem,
    handleKeyDown,
    saveRecent,
    goToSearch,
    voiceSupported,
    listening,
    toggleVoiceSearch,
    reset,
  };
}
