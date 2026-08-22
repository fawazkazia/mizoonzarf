export function artUrl(opts: { seed: string; kind?: "product" | "hero" | "category" | "collection" | "banner" | "square"; label?: string; caption?: string; w?: number; h?: number }): string {
  const params = new URLSearchParams();
  params.set("seed", opts.seed);
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.label) params.set("label", opts.label);
  if (opts.caption) params.set("caption", opts.caption);
  if (opts.w) params.set("w", String(opts.w));
  if (opts.h) params.set("h", String(opts.h));
  return `/api/art?${params.toString()}`;
}
