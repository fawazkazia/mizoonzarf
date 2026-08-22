import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressesClient } from "./AddressesClient";

export const metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  const session = await auth();
  const addresses = await db.address.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">My Addresses</h1>
      <AddressesClient
        initialAddresses={addresses.map((a) => ({
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
      />
    </div>
  );
}
