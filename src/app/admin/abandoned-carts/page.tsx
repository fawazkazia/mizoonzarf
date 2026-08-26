import { getAbandonedCarts } from "@/lib/data/abandoned-carts";
import { formatINR } from "@/lib/currency";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Img } from "@/components/ui/ArtImage";
import { RecoveryButton } from "./RecoveryButton";

export const metadata = { title: "Abandoned Carts" };

export default async function AbandonedCartsPage() {
  const carts = await getAbandonedCarts();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl">Abandoned Carts</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Carts left inactive for over an hour with items still in them. {carts.length} right now.
        </p>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Customer</Th>
            <Th>Items</Th>
            <Th className="text-right">Cart Value</Th>
            <Th>Last Active</Th>
            <Th className="text-right">Recovery</Th>
          </tr>
        </thead>
        <tbody>
          {carts.length === 0 && <EmptyRow colSpan={5}>No abandoned carts right now.</EmptyRow>}
          {carts.map((cart) => (
            <tr key={cart.id}>
              <Td>
                {cart.isGuest ? (
                  <span className="text-ink-soft">Guest</span>
                ) : (
                  <>
                    <p className="font-medium">{cart.customerName ?? cart.customerEmail}</p>
                    <p className="text-xs text-ink-soft">{cart.customerEmail}</p>
                  </>
                )}
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {cart.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="h-9 w-9 overflow-hidden border border-line bg-paper-dim ring-2 ring-paper">
                        <Img src={item.imageUrl} alt={item.productName} seedFallback={item.productName} />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-ink-soft">{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}</span>
                </div>
              </Td>
              <Td className="text-right">{formatINR(cart.value)}</Td>
              <Td className="text-xs text-ink-soft">{cart.updatedAt.toLocaleString()}</Td>
              <Td className="text-right">
                <RecoveryButton cartId={cart.id} disabled={cart.isGuest} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
