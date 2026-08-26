import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationRow } from "./NotificationRow";
import { MarkAllReadButton } from "./MarkAllReadButton";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  const notifications = await db.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Notifications</h1>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>
      {notifications.length === 0 ? (
        <p className="text-ink-soft">No notifications yet.</p>
      ) : (
        <div className="flex flex-col">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              title={n.title}
              body={n.body}
              link={n.link}
              isRead={n.isRead}
              createdAt={n.createdAt.toLocaleString(undefined, { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
