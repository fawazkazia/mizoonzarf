import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage/local";

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
    const result = await getStorageProvider().upload(file);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
