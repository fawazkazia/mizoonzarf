import { NextRequest } from "next/server";
import { buildArtSvg, sizeForKind } from "@/lib/placeholder-art";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const seed = params.get("seed") ?? "default";
  const kind = params.get("kind") ?? "product";
  const label = params.get("label") ?? undefined;
  const caption = params.get("caption") ?? undefined;
  const base = sizeForKind(kind);
  const width = Number(params.get("w")) || base.width;
  const height = Number(params.get("h")) || base.height;

  const svg = buildArtSvg({ seed, width, height, label, caption });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
