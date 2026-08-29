import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    // Read dimensions from an independent buffer read — File/Blob support
    // multiple independent reads, so this doesn't consume `file` before the
    // storage provider reads it below.
    let width: number | undefined;
    let height: number | undefined;
    try {
      const meta = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      // SVG or unreadable — upload still proceeds, just without a dimension hint.
    }

    const result = await getStorageProvider().upload(file);
    return NextResponse.json({ ...result, width, height });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
