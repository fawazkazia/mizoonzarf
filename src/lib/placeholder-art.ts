export interface PaletteEntry {
  from: string;
  to: string;
  ink: string;
}

/** Curated premium fashion-lookbook tones — deliberately avoids neon/random hues. */
export const ART_PALETTE: PaletteEntry[] = [
  { from: "#efe6d6", to: "#c9ae85", ink: "#4a3b24" },
  { from: "#dfe4d1", to: "#9bab80", ink: "#333f27" },
  { from: "#f0dcd7", to: "#cc9891", ink: "#5a3230" },
  { from: "#302f34", to: "#151419", ink: "#d8c39a" },
  { from: "#e8e5de", to: "#aca597", ink: "#33302a" },
  { from: "#ecc9ae", to: "#b5714a", ink: "#3c1e0d" },
  { from: "#dde6e8", to: "#9cb3ba", ink: "#28383d" },
  { from: "#f4e9c9", to: "#cba85c", ink: "#4a3b12" },
  { from: "#e8d6e2", to: "#916a7d", ink: "#392334" },
  { from: "#3d3a34", to: "#171510", ink: "#d8c39a" },
];

export function hashSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return Math.abs(h);
}

export function paletteFor(seed: string): PaletteEntry {
  return ART_PALETTE[hashSeed(seed) % ART_PALETTE.length];
}

export function initialsFor(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export interface ArtOptions {
  seed: string;
  width?: number;
  height?: number;
  label?: string;
  caption?: string;
}

const SIZE_BY_KIND: Record<string, { width: number; height: number }> = {
  product: { width: 900, height: 1125 },
  hero: { width: 1920, height: 1080 },
  category: { width: 900, height: 1125 },
  collection: { width: 1400, height: 900 },
  banner: { width: 1600, height: 700 },
  square: { width: 900, height: 900 },
};

export function sizeForKind(kind: string) {
  return SIZE_BY_KIND[kind] ?? SIZE_BY_KIND.square;
}

function escapeXml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));
}

export function buildArtSvg({ seed, width = 900, height = 1125, label, caption }: ArtOptions): string {
  const palette = paletteFor(seed);
  const angle = hashSeed(seed + "angle") % 360;
  const cx = width / 2;
  const cy = height / 2;
  const gradId = `g-${hashSeed(seed)}`;
  const patId = `p-${hashSeed(seed + "pat")}`;
  const monogram = label ? escapeXml(initialsFor(label)) : "";
  const safeCaption = caption ? escapeXml(caption) : "";
  const fontSize = Math.round(Math.min(width, height) * 0.34);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${palette.from}" />
      <stop offset="100%" stop-color="${palette.to}" />
    </linearGradient>
    <pattern id="${patId}" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle / 4})">
      <line x1="0" y1="0" x2="0" y2="46" stroke="${palette.ink}" stroke-opacity="0.05" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${gradId})" />
  <rect width="${width}" height="${height}" fill="url(#${patId})" />
  <circle cx="${cx + width * 0.22}" cy="${cy - height * 0.18}" r="${width * 0.32}" fill="${palette.ink}" fill-opacity="0.05" />
  ${
    monogram
      ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="${fontSize}" fill="${palette.ink}" fill-opacity="0.16" letter-spacing="4">${monogram}</text>`
      : ""
  }
  ${
    safeCaption
      ? `<text x="${cx}" y="${height - height * 0.07}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="${Math.round(width * 0.028)}" letter-spacing="3" fill="${palette.ink}" fill-opacity="0.55">${safeCaption.toUpperCase()}</text>`
      : ""
  }
</svg>`;
}
