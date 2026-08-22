"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Search, Menu } from "lucide-react";
import { AdminMobileNav } from "./AdminMobileNav";

interface SearchResults {
  products: { id: string; name: string; slug: string }[];
  orders: { id: string; orderNumber: string }[];
  customers: { id: string; name: string | null; email: string }[];
}

export function AdminTopbar({ name, role }: { name: string; role: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
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
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-paper px-4 py-3 print:hidden lg:px-6">
      <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div ref={boxRef} className="relative w-full max-w-sm">
        <div className="flex items-center gap-2 border border-line px-3 py-2">
          <Search size={15} className="text-ink-soft" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search products, orders, customers..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {open && results && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto border border-line bg-paper shadow-lg">
            {results.products.length === 0 && results.orders.length === 0 && results.customers.length === 0 && (
              <p className="p-4 text-sm text-ink-soft">No results.</p>
            )}
            {results.products.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-ink-soft">Products</p>
                {results.products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/products/${p.id}/edit`}
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-2 py-1.5 text-sm hover:bg-paper-dim"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
            {results.orders.length > 0 && (
              <div className="border-t border-line p-2">
                <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-ink-soft">Orders</p>
                {results.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-2 py-1.5 text-sm hover:bg-paper-dim"
                  >
                    {o.orderNumber}
                  </Link>
                ))}
              </div>
            )}
            {results.customers.length > 0 && (
              <div className="border-t border-line p-2">
                <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-ink-soft">Customers</p>
                {results.customers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/customers/${c.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-2 py-1.5 text-sm hover:bg-paper-dim"
                  >
                    {c.name ?? c.email}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink-soft">{role.replace(/_/g, " ")}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" }).then(() => router.refresh())}
          className="text-xs uppercase tracking-[0.1em] text-sale underline"
        >
          Sign Out
        </button>
      </div>

      <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
