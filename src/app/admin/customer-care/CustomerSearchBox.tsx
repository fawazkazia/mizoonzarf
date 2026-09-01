"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface CustomerResult {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

/** The Customer Care Dashboard's front door, per spec's workflow: "Customer calls -> Employee
 * opens Customer Care -> Searches mobile number/email -> Customer appears -> Clicks View
 * Profile." Deliberately its own search (not the general admin topbar search, which doesn't
 * match on phone) so a call can be resolved without leaving this page. */
export function CustomerSearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/admin/customer-care/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.customers);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-3 border border-line bg-paper px-4 py-3.5">
        <Search size={18} className="text-ink-soft" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, mobile number, email, or order ID..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto border border-line bg-paper shadow-lg">
          {loading && <p className="p-4 text-sm text-ink-soft">Searching...</p>}
          {!loading && results && results.length === 0 && <p className="p-4 text-sm text-ink-soft">No customers found.</p>}
          {!loading &&
            results?.map((c) => (
              <Link
                key={c.id}
                href={`/admin/customers/${c.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-0 hover:bg-paper-dim"
              >
                <div>
                  <p className="text-sm font-medium">{c.name ?? "Customer"}</p>
                  <p className="text-xs text-ink-soft">
                    {c.phone ?? "No phone"} · {c.email}
                  </p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-wide text-ink-soft">View Profile →</span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
