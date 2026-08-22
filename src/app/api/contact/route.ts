import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSettings } from "@/lib/settings";
import { notify } from "@/lib/notifications/registry";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const body = contactSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

  const settings = await getSettings();
  await notify({
    channel: "EMAIL",
    to: settings.supportEmail,
    templateKey: "contact_form_submission",
    variables: { customer_name: body.data.name, customer_email: body.data.email, message: body.data.message },
  });

  return NextResponse.json({ ok: true });
}
