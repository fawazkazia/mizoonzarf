import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-ink-soft">…</span>}
          <Link
            href={buildHref(p)}
            className={`flex h-8 w-8 items-center justify-center border text-sm ${
              p === page ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}
    </div>
  );
}
