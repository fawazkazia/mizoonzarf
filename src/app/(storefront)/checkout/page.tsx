import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPaymentMethods } from "@/lib/payments/registry";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();

  const addresses = session?.user
    ? await db.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })
    : [];

  const paymentMethods = listPaymentMethods().map((p) => ({ id: p.id, label: p.label, configured: p.isConfigured() }));

  return (
    <CheckoutClient
      isSignedIn={Boolean(session?.user)}
      userEmail={session?.user?.email ?? ""}
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
    />
  );
}
