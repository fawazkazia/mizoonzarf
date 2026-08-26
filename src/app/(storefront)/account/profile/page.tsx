import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { VerifyMobileButton } from "@/components/account/VerifyMobileButton";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const [orderCount, wishlistCount, user] = await Promise.all([
    db.order.count({ where: { userId: session!.user.id } }),
    db.wishlistItem.count({ where: { userId: session!.user.id } }),
    db.user.findUnique({ where: { id: session!.user.id }, select: { phone: true, phoneVerifiedAt: true } }),
  ]);

  const phoneVerified = Boolean(user?.phoneVerifiedAt);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">My Profile</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-line p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Name</p>
          <p className="mt-1 text-lg">{session!.user.name ?? "—"}</p>
        </div>
        <div className="border border-line p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Email</p>
          <p className="mt-1 text-lg">{session!.user.email}</p>
        </div>
        <div className="border border-line p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Mobile Number</p>
          <p className="mt-1 text-lg">{user?.phone ?? "—"}</p>
          <div className="mt-2">
            {phoneVerified ? (
              <Badge tone="success">✓ Mobile Number Verified</Badge>
            ) : (
              <>
                <Badge tone="outline">Not Verified</Badge>
                <VerifyMobileButton phone={user?.phone ?? null} verified={phoneVerified} />
              </>
            )}
          </div>
        </div>
        <Link href="/account/orders" className="border border-line p-6 transition-colors hover:border-ink">
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Total Orders</p>
          <p className="mt-1 text-lg">{orderCount}</p>
          <p className="mt-1 text-xs underline underline-offset-2 text-ink-soft">Track your orders</p>
        </Link>
        <div className="border border-line p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Wishlist Items</p>
          <p className="mt-1 text-lg">{wishlistCount}</p>
        </div>
      </div>
    </div>
  );
}
