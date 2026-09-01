"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Search, Menu, ArrowLeft, Sun, Moon, UserCircle, Headset } from "lucide-react";
import { AdminMobileNav } from "./AdminMobileNav";
import { useAdminTheme } from "./AdminThemeProvider";
import { CUSTOMER_CARE_ROLES } from "@/lib/admin-permissions";

interface SearchResults {
  products: { id: string; name: string; slug: string }[];
  orders: { id: string; orderNumber: string }[];
  customers: { id: string; name: string | null; email: string }[];
  variants: { id: string; sku: string; barcode: string | null; product: { id: string; name: string } }[];
}

export function AdminTopbar({ name, role }: { name: string; role: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);
  const isRoot = pathname === "/admin";
  const { theme, toggle } = useAdminTheme();
  const canSeeCustomerCare = CUSTOMER_CARE_ROLES.includes(role as never);

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

      {!isRoot && (
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="shrink-0 text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <div ref={boxRef} className="relative min-w-0 w-full max-w-sm">
        <div className="flex items-center gap-2 border border-line px-3 py-2">
          <Search size={15} className="text-ink-soft" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search products, orders, customers, barcodes..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {open && results && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto border border-line bg-paper shadow-lg">
            {results.products.length === 0 &&
              results.orders.length === 0 &&
              results.customers.length === 0 &&
              results.variants.length === 0 && <p className="p-4 text-sm text-ink-soft">No results.</p>}
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
            {results.variants.length > 0 && (
              <div className="border-t border-line p-2">
                <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-ink-soft">Barcodes</p>
                {results.variants.map((v) => (
                  <Link
                    key={v.id}
                    href={`/admin/products/${v.product.id}/edit`}
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-2 py-1.5 text-sm hover:bg-paper-dim"
                  >
                    {v.product.name} <span className="text-xs text-ink-soft">({v.barcode ?? v.sku})</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {canSeeCustomerCare && (
          <Link
            href="/admin/customer-care"
            className="flex items-center gap-2 border border-ink bg-ink px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink-soft"
          >
            <Headset size={14} />
            <span className="hidden sm:inline">Customer Care</span>
          </Link>
        )}
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <Link
          href="/admin/profile"
          aria-label="My Profile"
          title="My Profile"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink sm:hidden"
        >
          <UserCircle size={16} />
        </Link>
        <Link
          href="/admin/profile"
          title="My Profile"
          className="hidden items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-right transition-colors hover:border-ink sm:flex"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-dim text-ink-soft">
            <UserCircle size={15} />
          </span>
          <span>
            <p className="text-sm font-medium leading-tight">{name}</p>
            <p className="text-[10px] uppercase tracking-wide text-ink-soft">{role.replace(/_/g, " ")}</p>
          </span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" }).then(() => router.refresh())}
          className="text-xs uppercase tracking-[0.1em] text-sale underline"
        >
          Sign Out
        </button>
      </div>

      <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} role={role} />
    </header>
  );
}
