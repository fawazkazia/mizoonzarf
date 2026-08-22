import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { SignOutButton } from "@/components/account/SignOutButton";

const NAV = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
];

const COMING_SOON = ["Loyalty Points", "Referrals", "Returns"];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/profile");

  return (
    <Container className="grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
      <aside>
        <p className="mb-1 font-display text-xl">{session.user.name ?? "My Account"}</p>
        <p className="mb-6 text-xs text-ink-soft">{session.user.email}</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="py-2 text-sm text-ink-soft hover:text-ink">
              {item.label}
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
