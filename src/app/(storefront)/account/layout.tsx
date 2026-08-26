import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkGuestOrdersToUser } from "@/lib/orders/link-guest-orders";
import { Container } from "@/components/ui/Container";
import { SignOutButton } from "@/components/account/SignOutButton";

const NAV = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/loyalty", label: "Loyalty Points" },
  { href: "/account/notifications", label: "Notifications" },
];

const COMING_SOON = ["Referrals"];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/profile");

  if (session.user.email) await linkGuestOrdersToUser(session.user.id, session.user.email);

  const unreadCount = await db.notification.count({ where: { userId: session.user.id, isRead: false } });

  return (
    <Container className="grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
      <aside>
        <p className="mb-1 font-display text-xl">{session.user.name ?? "My Account"}</p>
        <p className="mb-6 text-xs text-ink-soft">{session.user.email}</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center justify-between py-2 text-sm text-ink-soft hover:text-ink">
              {item.label}
              {item.href === "/account/notifications" && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] text-paper">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
          {COMING_SOON.map((label) => (
            <span key={label} className="flex items-center gap-2 py-2 text-sm text-ink-soft/40">
              {label} <span className="text-[10px] uppercase">Soon</span>
            </span>
          ))}
        </nav>
        <SignOutButton />
      </aside>
      <div>{children}</div>
    </Container>
  );
}
