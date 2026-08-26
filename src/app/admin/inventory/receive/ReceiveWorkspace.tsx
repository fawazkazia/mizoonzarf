"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ScanInput } from "@/components/admin/barcode/ScanInput";
import { Field, Input, Select } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { lookupBarcode } from "../scan-actions";
import { receiveStock } from "../stock-actions";

type LookupResult = Awaited<ReturnType<typeof lookupBarcode>>;

export function ReceiveWorkspace({ warehouses }: { warehouses: { id: string; name: string }[] }) {
  const [result, setResult] = useState<LookupResult | null>(null);
  const [qty, setQty] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<{ previous: number; received: number; next: number } | null>(null);

  async function runScan(code: string) {
    setConfirmed(null);
    try {
      const found = await lookupBarcode(code, "RECEIVING");
      if (!found) {
        toast.error(`Barcode "${code}" not found.`);
        return;
      }
      setResult(found);
      setQty("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed.");
    }
  }

  async function confirm() {
    if (!result) return;
    const quantity = Number(qty);
    if (!quantity || quantity <= 0) {
      toast.error("Enter a quantity greater than zero.");
      return;
    }
    setBusy(true);
    try {
      const previous = result.variant.stock;
      await receiveStock(result.variant.id, warehouseId, quantity);
      setConfirmed({ previous, received: quantity, next: previous + quantity });
      toast.success("Stock received.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't receive stock.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <ScanInput onScan={runScan} placeholder="Scan the item being received" />

      {result && (
        <div className="border border-line p-5">
          <h2 className="font-display text-lg">{result.product.name}</h2>
          <p className="text-sm text-ink-soft">
            {[result.variant.size, result.variant.color].filter(Boolean).join(" / ") || "Default"} · SKU {result.variant.sku}
          </p>
          <p className="mt-2 text-sm">
            Current stock: <span className="font-medium">{result.variant.stock}</span>
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <Field label="Warehouse">
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quantity Received">
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
            </Field>
            <Button type="button" disabled={busy} onClick={confirm}>
              Confirm
            </Button>
          </div>

          {confirmed && (
            <p className="mt-4 border-t border-line pt-4 text-sm">
              Received: <span className="font-medium">+{confirmed.received}</span> — new stock:{" "}
              <span className="font-medium">{confirmed.next}</span> (was {confirmed.previous})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
