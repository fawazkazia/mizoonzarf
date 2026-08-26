import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Loyalty Points" };

const TYPE_LABELS: Record<string, string> = {
  EARN_ORDER: "Earned",
  REVERSE_ORDER: "Reversed",
};

export default async function LoyaltyPage() {
  const session = await auth();
  const account = await db.loyaltyAccount.findUnique({
    where: { userId: session!.user.id },
    include: { transactions: { orderBy: { createdAt: "desc" } } },
  });

  const balance = account?.pointsBalance ?? 0;
  const transactions = account?.transactions ?? [];

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Loyalty Points</h1>

      <div className="mb-8 border border-line bg-paper-dim p-6">
        <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Current Balance</p>
        <p className="mt-1 font-display text-4xl">{balance} pts</p>
      </div>

      {transactions.length === 0 ? (
        <p className="text-ink-soft">
          Points are credited once a delivered order is complete. Shop and check back here after your next order arrives.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-medium">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                <p className="text-xs text-ink-soft">
                  {tx.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  {tx.description ? ` — ${tx.description}` : ""}
                </p>
              </div>
              <span className={`text-sm font-medium ${tx.points >= 0 ? "text-success" : "text-sale"}`}>
                {tx.points >= 0 ? "+" : ""}
                {tx.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
