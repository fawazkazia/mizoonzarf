import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";

const requestSchema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: "The AI Shopping Assistant isn't connected yet." }, { status: 503 });
  }

  const body = requestSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Enter a message." }, { status: 400 });
  }

  try {
    const result = await provider.chatStyleAssistant(body.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/ai/assistant] failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 502 });
  }
}
