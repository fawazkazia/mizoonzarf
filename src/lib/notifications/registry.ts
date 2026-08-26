import { ConsoleNotificationProvider } from "./console";
import { ResendEmailProvider } from "./email";
import { TwilioSmsProvider } from "./sms";
import { WhatsAppBusinessProvider } from "./whatsapp";
import type { NotificationChannel, NotificationMessage, NotificationProvider } from "./provider";

const emailProvider = new ResendEmailProvider();
const smsProvider = new TwilioSmsProvider();
const whatsappProvider = new WhatsAppBusinessProvider();

const providers: Record<NotificationChannel, NotificationProvider> = {
  EMAIL: emailProvider.isConfigured() ? emailProvider : new ConsoleNotificationProvider("EMAIL"),
  SMS: smsProvider.isConfigured() ? smsProvider : new ConsoleNotificationProvider("SMS"),
  WHATSAPP: whatsappProvider.isConfigured() ? whatsappProvider : new ConsoleNotificationProvider("WHATSAPP"),
};

export async function notify(message: NotificationMessage): Promise<void> {
  await providers[message.channel].send(message);
}

export const ORDER_EVENT_TEMPLATES = {
  ORDER_PLACED: "order_placed",
  PAYMENT_CONFIRMED: "payment_confirmed",
  PROCESSING: "order_processing",
  PACKED: "order_packed",
  SHIPPED: "order_shipped",
  OUT_FOR_DELIVERY: "order_out_for_delivery",
  DELIVERED: "order_delivered",
  CANCELLED: "order_cancelled",
  RETURN_REQUESTED: "return_requested",
  RETURNED: "return_received",
  REFUNDED: "order_refunded",
} as const;
