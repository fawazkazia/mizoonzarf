import twilio from "twilio";
import { renderTemplate } from "./templates";
import type { NotificationChannel, NotificationMessage, NotificationProvider } from "./provider";

export class TwilioSmsProvider implements NotificationProvider {
  channel: NotificationChannel = "SMS";

  isConfigured(): boolean {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  }

  async send(message: NotificationMessage): Promise<void> {
    const { body } = await renderTemplate(message.templateKey, "SMS", message.variables);
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    await client.messages.create({ from: process.env.TWILIO_FROM_NUMBER!, to: message.to, body });
  }
}
