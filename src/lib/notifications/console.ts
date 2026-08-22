import type { NotificationChannel, NotificationMessage, NotificationProvider } from "./provider";

/**
 * Dev-mode sink used until real Email/SMS/WhatsApp providers are connected in
 * Phase 3 (e.g. Resend/SendGrid for email, Twilio for SMS, WhatsApp Business
 * Cloud API). Logs instead of sending so order events are still visible
 * during development without pretending a message was delivered.
 */
export class ConsoleNotificationProvider implements NotificationProvider {
  constructor(public channel: NotificationChannel) {}

  isConfigured(): boolean {
    return true;
  }

  async send(message: NotificationMessage): Promise<void> {
    console.log(
      `[notifications:${this.channel}] -> ${message.to} | template=${message.templateKey} | vars=${JSON.stringify(
        message.variables
      )}`
    );
  }
}
