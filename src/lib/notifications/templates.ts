import { db } from "@/lib/db";
import type { NotificationChannel } from "./provider";

interface RenderedTemplate {
  subject?: string;
  body: string;
}

/**
 * Prose content for EMAIL/SMS. WhatsApp doesn't use this — Meta's Business
 * Cloud API requires pre-approved message templates managed in Meta Business
 * Manager, not freeform text (see whatsapp.ts).
 */
const DEFAULT_TEMPLATES: Record<string, Partial<Record<"EMAIL" | "SMS", RenderedTemplate>>> = {
  order_placed: {
    EMAIL: { subject: "We've received your order {{order_number}}", body: "Hi {{customer_name}}, thanks for your order {{order_number}} — total {{order_total}}. We'll let you know as soon as it ships." },
    SMS: { body: "Order {{order_number}} received - total {{order_total}}. Thanks for shopping with us!" },
  },
  payment_confirmed: {
    EMAIL: { subject: "Payment confirmed for order {{order_number}}", body: "Your payment for order {{order_number}} ({{order_total}}) has been confirmed. We're preparing your order now." },
    SMS: { body: "Payment confirmed for order {{order_number}} ({{order_total}})." },
  },
  order_processing: {
    EMAIL: { subject: "Order {{order_number}} is being processed", body: "Your order {{order_number}} is now being processed." },
    SMS: { body: "Order {{order_number}} is being processed." },
  },
  order_packed: {
    EMAIL: { subject: "Order {{order_number}} has been packed", body: "Your order {{order_number}} has been packed and is ready to ship." },
    SMS: { body: "Order {{order_number}} has been packed." },
  },
  order_shipped: {
    EMAIL: { subject: "Your order {{order_number}} has shipped", body: "Good news — order {{order_number}} is on its way." },
    SMS: { body: "Order {{order_number}} has shipped and is on its way." },
  },
  order_out_for_delivery: {
    EMAIL: { subject: "Order {{order_number}} is out for delivery", body: "Your order {{order_number}} is out for delivery today." },
    SMS: { body: "Order {{order_number}} is out for delivery today." },
  },
  order_delivered: {
    EMAIL: { subject: "Order {{order_number}} delivered", body: "Order {{order_number}} has been delivered. Enjoy!" },
    SMS: { body: "Order {{order_number}} has been delivered. Enjoy!" },
  },
  order_cancelled: {
    EMAIL: { subject: "Order {{order_number}} cancelled", body: "Your order {{order_number}} has been cancelled." },
    SMS: { body: "Order {{order_number}} has been cancelled." },
  },
  order_refunded: {
    EMAIL: { subject: "Order {{order_number}} refunded", body: "Your payment for order {{order_number}} ({{order_total}}) has been refunded." },
    SMS: { body: "Order {{order_number}} has been refunded." },
  },
  return_requested: {
    EMAIL: { subject: "Return requested for order {{order_number}}", body: "We've received your return request for order {{order_number}}." },
  },
  return_received: {
    EMAIL: { subject: "Return received for order {{order_number}}", body: "We've received your return for order {{order_number}}." },
  },
  cart_abandoned: {
    EMAIL: { subject: "You left something in your cart", body: "Hi {{customer_name}}, you still have {{item_count}} item(s) waiting in your cart. Complete your order before they sell out." },
  },
  contact_form_submission: {
    EMAIL: { subject: "New contact form message from {{customer_name}}", body: "From: {{customer_name}} ({{customer_email}})\n\n{{message}}" },
  },
  phone_verify_otp: {
    SMS: { body: "Your verification code is {{code}}. It expires in {{minutes}} minutes. Don't share this code with anyone." },
  },
  cod_risk_confirm_otp: {
    SMS: { body: "Confirm your Cash on Delivery order with code {{code}}. It expires in {{minutes}} minutes. Don't share this code with anyone." },
  },
};

function interpolate(text: string, variables: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in variables ? String(variables[key]) : match));
}

export async function renderTemplate(
  key: string,
  channel: Exclude<NotificationChannel, "WHATSAPP">,
  variables: Record<string, string | number>
): Promise<RenderedTemplate> {
  const row = await db.notificationTemplate.findUnique({ where: { key_channel: { key, channel } } }).catch(() => null);

  const fallback = DEFAULT_TEMPLATES[key]?.[channel];
  const subject = row?.subject ?? fallback?.subject;
  const body = row?.body ?? fallback?.body ?? `Update on your order {{order_number}}.`;

  return {
    subject: subject ? interpolate(subject, variables) : undefined,
    body: interpolate(body, variables),
  };
}
