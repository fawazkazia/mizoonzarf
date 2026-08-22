import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const [orderCount, wishlistCount] = await Promise.all([
    db.order.count({ where: { userId: session!.user.id } }),
    db.wishlistItem.count({ where: { userId: session!.user.id } }),
  ]);

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
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Total Orders</p>
          <p className="mt-1 text-lg">{orderCount}</p>
        </div>
        <div className="border border-line p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Wishlist Items</p>
          <p className="mt-1 text-lg">{wishlistCount}</p>
        </div>
      </div>
    </div>
  );
}
