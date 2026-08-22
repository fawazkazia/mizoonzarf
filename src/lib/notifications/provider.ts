export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP";

export interface NotificationMessage {
  channel: NotificationChannel;
  to: string;
  templateKey: string;
  variables: Record<string, string | number>;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  isConfigured(): boolean;
  send(message: NotificationMessage): Promise<void>;
}
