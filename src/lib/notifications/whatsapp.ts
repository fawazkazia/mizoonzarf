import type { NotificationChannel, NotificationMessage, NotificationProvider } from "./provider";

function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_BUSINESS_API_TOKEN && process.env.WHATSAPP_BUSINESS_PHONE_ID);
}

/**
 * Best-effort freeform WhatsApp reply for an active Customer Care ticket conversation — uses
 * Meta's session-message ("type: text") capability, valid only within the 24h customer-service
 * window after the customer's last inbound message. Distinct from WhatsAppBusinessProvider.send()
 * above, which is hard-wired to pre-approved *template* messages for order-lifecycle
 * notifications and can't send arbitrary staff-typed text. Never throws — a ticket reply's
 * WhatsApp send is a nice-to-have, not something that should fail the whole reply action.
 */
export async function sendWhatsAppFreeformBestEffort(to: string, bodyText: string): Promise<boolean> {
  if (!whatsappConfigured()) {
    console.log(`[whatsapp-freeform] not configured, skipping send to ${to}`);
    return false;
  }
  try {
    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID;
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: bodyText },
      }),
    });
    if (!res.ok) {
      console.error(`[whatsapp-freeform] send failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp-freeform] send threw", err);
    return false;
  }
}

/**
 * Meta's WhatsApp Business Cloud API cannot send freeform text for
 * business-initiated messages outside an active 24h customer-service window
 * — it requires a pre-approved message template (name + language + ordered
 * {{n}} parameters), approved in Meta Business Manager, outside this codebase.
 * `templateKey` must match the name of a template you've created and had
 * approved there. If you rename/add order events, add their parameter order
 * here to match the approved template's placeholders.
 */
const PARAM_ORDER: Record<string, string[]> = {
  order_placed: ["customer_name", "order_number", "order_total"],
  payment_confirmed: ["order_number", "order_total"],
  order_shipped: ["order_number"],
  order_out_for_delivery: ["order_number"],
  order_delivered: ["order_number"],
  order_cancelled: ["order_number"],
};

export class WhatsAppBusinessProvider implements NotificationProvider {
  channel: NotificationChannel = "WHATSAPP";

  isConfigured(): boolean {
    return Boolean(process.env.WHATSAPP_BUSINESS_API_TOKEN && process.env.WHATSAPP_BUSINESS_PHONE_ID);
  }

  async send(message: NotificationMessage): Promise<void> {
    const paramOrder = PARAM_ORDER[message.templateKey];
    if (!paramOrder) {
      throw new Error(`No WhatsApp template parameter mapping for "${message.templateKey}" — add one to PARAM_ORDER in whatsapp.ts.`);
    }

    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID;
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: message.templateKey,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "en" },
          components: [
            {
              type: "body",
              parameters: paramOrder.map((key) => ({ type: "text", text: String(message.variables[key] ?? "") })),
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`);
    }
  }
}
