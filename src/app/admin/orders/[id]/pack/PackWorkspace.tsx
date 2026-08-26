"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanInput } from "@/components/admin/barcode/ScanInput";
import { Button } from "@/components/ui/Button";
import { Table, Th, Td } from "@/components/admin/Table";
import { scanPackItem, markOrderPacked } from "../../pack-actions";
import type { OrderStatus } from "@/generated/prisma/client";

interface Item {
  id: string;
  productName: string;
  variantLabel: string | null;
  sku: string;
  quantity: number;
  packedQuantity: number;
}

export function PackWorkspace({ orderId, status, items: initialItems }: { orderId: string; status: OrderStatus; items: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [flash, setFlash] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [finishing, setFinishing] = useState(false);

  const allPacked = items.every((i) => i.packedQuantity >= i.quantity);
  const alreadyPacked = status !== "ORDER_PLACED" && status !== "PAYMENT_CONFIRMED" && status !== "PROCESSING";

  async function handleScan(code: string) {
    const result = await scanPackItem(orderId, code);
    if (!result.ok) {
      const messages = {
        NOT_FOUND: `Barcode "${code}" not found.`,
        WRONG_PRODUCT: "⚠ WRONG PRODUCT — that item isn't on this order.",
        ALREADY_COMPLETE: "That item is already fully scanned.",
      };
      setFlash({ kind: "error", message: messages[result.reason] });
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === result.item.id ? { ...i, packedQuantity: result.item.packedQuantity } : i)));
    setFlash({ kind: "ok", message: `✓ ${result.item.productName} scanned (${result.item.packedQuantity}/${result.item.quantity}).` });
  }

  async function handleMarkPacked() {
    setFinishing(true);
    try {
      await markOrderPacked(orderId);
      toast.success("Order marked as packed.");
      router.push(`/admin/orders/${orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't mark order as packed.");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {alreadyPacked && (
        <p className="border border-line bg-paper-dim px-4 py-3 text-sm text-ink-soft">
          This order is already <span className="font-medium">{status.replace(/_/g, " ")}</span>. Scans below still record, but packing
          verification is normally done before this stage.
        </p>
      )}

      <ScanInput onScan={handleScan} placeholder="Scan each item in this order" />

      {flash && (
        <p className={`border px-4 py-3 text-sm ${flash.kind === "ok" ? "border-success/40 text-success" : "border-sale/40 text-sale"}`}>
          {flash.message}
        </p>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th className="text-right">Scanned</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const complete = i.packedQuantity >= i.quantity;
            return (
              <tr key={i.id}>
                <Td>
                  {i.productName}
                  {i.variantLabel && <span className="ml-1 text-xs text-ink-soft">({i.variantLabel})</span>}
                </Td>
                <Td className="text-xs">{i.sku}</Td>
                <Td className={`text-right ${complete ? "text-success" : ""}`}>
                  {complete && "✓ "}
                  {i.packedQuantity} / {i.quantity}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Button type="button" size="lg" disabled={!allPacked || finishing} onClick={handleMarkPacked} className="self-start">
        {allPacked ? "Mark as Packed" : "Scan all items to continue"}
      </Button>
    </div>
  );
}
