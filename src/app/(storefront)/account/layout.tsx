import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkGuestOrdersToUser } from "@/lib/orders/link-guest-orders";
import { getSettings } from "@/lib/settings";
import { Container } from "@/components/ui/Container";
import { AccountSidebar } from "@/components/account/AccountSidebar";

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/profile");

  if (session.user.email) await linkGuestOrdersToUser(session.user.id, session.user.email);

  const [unreadCount, settings] = await Promise.all([
    db.notification.count({ where: { userId: session.user.id, isRead: false } }),
    getSettings(),
  ]);

  const brand = settings.promoStrips.brandsBanner;
  const accent = brand.gradientVia;
  const initials = getInitials(session.user.name, session.user.email ?? "U");

  return (
    <Container className="grid gap-6 py-8 sm:py-12 lg:grid-cols-[260px_1fr] lg:items-start lg:gap-10">
      <AccountSidebar
        name={session.user.name ?? "My Account"}
        email={session.user.email ?? ""}
        initials={initials}
        accent={accent}
        unreadCount={unreadCount}
      />
      <div className="min-w-0">{children}</div>
    </Container>
  );
}
