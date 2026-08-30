import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { EMAIL_NOTIFICATION_CATALOG } from "@/lib/notifications/catalog";
import { getDefaultTemplate } from "@/lib/notifications/templates";
import { NotificationsTabs } from "./NotificationsTabs";

export const metadata = { title: "Email Notifications" };

export default async function NotificationsPage() {
  const [settings, templateRows, logs] = await Promise.all([
    getSettings(),
    db.notificationTemplate.findMany({ where: { channel: "EMAIL" } }),
    db.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { orderNumber: true } }, user: { select: { name: true } } },
    }),
  ]);

  const templateByKey = new Map(templateRows.map((row) => [row.key, row]));
  const templates = EMAIL_NOTIFICATION_CATALOG.map((def) => {
    const row = templateByKey.get(def.key);
    const fallback = getDefaultTemplate(def.key, "EMAIL");
    return {
      key: def.key,
      label: def.label,
      description: def.description,
      group: def.group,
      isActive: row?.isActive ?? true,
      subject: row?.subject ?? fallback?.subject ?? "",
      body: row?.body ?? fallback?.body ?? "",
    };
  });

  const logRows = logs.map((log) => ({
    id: log.id,
    toEmail: log.toEmail,
    customerName: log.user?.name ?? null,
    orderNumber: log.order?.orderNumber ?? null,
    notificationType: log.notificationType,
    subject: log.subject,
    status: log.status,
    errorMessage: log.errorMessage,
    isTest: log.isTest,
    retryCount: log.retryCount,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Email Notifications</h1>
        <p className="mt-1 text-sm text-ink-soft">Control what customer emails are sent, how they look, and review send history.</p>
      </div>
      <NotificationsTabs templates={templates} branding={settings.email} logs={logRows} />
    </div>
  );
}
