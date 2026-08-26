import { Resend } from "resend";
import { renderTemplate } from "./templates";
import type { NotificationChannel, NotificationMessage, NotificationProvider } from "./provider";

export class ResendEmailProvider implements NotificationProvider {
  channel: NotificationChannel = "EMAIL";

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  }

  async send(message: NotificationMessage): Promise<void> {
    const { subject, body } = await renderTemplate(message.templateKey, "EMAIL", message.variables);
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: message.to,
      subject: subject ?? "Update on your order",
      text: body,
    });
    if (error) throw new Error(`Resend send failed: ${error.message}`);
  }
}
