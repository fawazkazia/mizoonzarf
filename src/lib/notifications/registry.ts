import { ConsoleNotificationProvider } from "./console";
import type { NotificationChannel, NotificationMessage, NotificationProvider } from "./provider";

const providers: Record<NotificationChannel, NotificationProvider> = {
  EMAIL: new ConsoleNotificationProvider("EMAIL"),
  SMS: new ConsoleNotificationProvider("SMS"),
  WHATSAPP: new ConsoleNotificationProvider("WHATSAPP"),
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
