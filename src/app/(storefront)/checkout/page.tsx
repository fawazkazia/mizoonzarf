import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPaymentMethods } from "@/lib/payments/registry";
import { getActiveOffers } from "@/lib/data/offers";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();

  const [addresses, verifiedUser] = await Promise.all([
    session?.user
      ? db.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })
      : Promise.resolve([]),
    session?.user
      ? db.user.findUnique({ where: { id: session.user.id }, select: { phone: true, phoneVerifiedAt: true } })
      : Promise.resolve(null),
  ]);

  const hiddenPaymentMethods = new Set(["APPLE_PAY", "GOOGLE_PAY", "TABBY", "TAMARA"]);
  const paymentMethods = listPaymentMethods()
    .filter((p) => !hiddenPaymentMethods.has(p.id))
    .map((p) => ({ id: p.id, label: p.label, configured: p.isConfigured() }));
  const offers = await getActiveOffers();

  return (
    <CheckoutClient
      isSignedIn={Boolean(session?.user)}
      userEmail={session?.user?.email ?? ""}
      accountVerifiedPhone={verifiedUser?.phoneVerifiedAt ? verifiedUser.phone : null}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        fullName: a.fullName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        country: a.country,
        postalCode: a.postalCode,
        isDefault: a.isDefault,
      }))}
      paymentMethods={paymentMethods}
      offers={offers}
    />
  );
}
