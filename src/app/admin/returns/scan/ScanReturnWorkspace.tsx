"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanInput } from "@/components/admin/barcode/ScanInput";
import { Field, Select, Input } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { scanReturnItem, resolveReturn } from "../actions";
import { formatAttrs } from "@/lib/inventory/variant-attributes";
import type { ReturnResolution } from "@/generated/prisma/client";

type ScanResult = Awaited<ReturnType<typeof scanReturnItem>>;
type Match = NonNullable<ScanResult>["matches"][number];

const RESOLUTIONS: { value: ReturnResolution; label: string }[] = [
  { value: "RESTOCK", label: "Restock" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXCHANGE", label: "Exchange" },
  { value: "REFUND", label: "Refund" },
  { value: "INSPECTION_REQUIRED", label: "Inspection Required" },
];

export function ScanReturnWorkspace({ warehouses }: { warehouses: { id: string; name: string }[] }) {
  const router = useRouter();
  const [lastCode, setLastCode] = useState("");
  const [result, setResult] = useState<ScanResult | null | undefined>(undefined);
  const [selected, setSelected] = useState<Match | null>(null);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [refundAmount, setRefundAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function runScan(code: string) {
    setLastCode(code);
    setSelected(null);
    try {
      const found = await scanReturnItem(code);
      setResult(found);
      if (found?.matches.length === 1) setSelected(found.matches[0]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed.");
    }
  }

  async function handleResolve(resolution: ReturnResolution) {
    if (!selected) return;
    setBusy(true);
    try {
      await resolveReturn({
        returnId: selected.existingReturn?.id,
        orderItemId: selected.orderItemId,
        resolution,
        warehouseId: resolution === "RESTOCK" || resolution === "DAMAGED" ? warehouseId : undefined,
        refundAmount: resolution === "REFUND" && refundAmount ? Number(refundAmount) : undefined,
        adminNote: adminNote || undefined,
      });
      toast.success(`Return resolved: ${resolution.replace(/_/g, " ")}.`);
      router.push("/admin/returns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't resolve return.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ScanInput onScan={runScan} placeholder="Scan the returned item" />

      {result === null && (
        <div className="border border-sale/40 bg-sale/5 p-6 text-center">
          <p className="font-display text-lg text-sale">Barcode not found</p>
          <p className="mt-1 text-sm text-ink-soft">&ldquo;{lastCode}&rdquo; doesn&apos;t match any variant.</p>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="border border-line p-4">
            <p className="font-display text-lg">{result.variant.productName}</p>
            <p className="text-sm text-ink-soft">
              {formatAttrs(result.variant.attributes) || "Default"} · SKU {result.variant.sku}
            </p>
          </div>

          {result.matches.length === 0 && <p className="text-sm text-ink-soft">No orders found containing this item.</p>}

          <div className="flex flex-col gap-2">
            {result.matches.map((m) => (
              <button
                key={m.orderItemId}
                type="button"
                onClick={() => setSelected(m)}
                className={`flex items-center justify-between border p-3 text-left text-sm ${
                  selected?.orderItemId === m.orderItemId ? "border-ink" : "border-line hover:border-ink/50"
                }`}
              >
                <span>
                  Order {m.orderNumber} — {m.customer}
                  <span className="ml-2 text-xs text-ink-soft">Purchased {new Date(m.purchaseDate).toLocaleDateString()}</span>
                </span>
                {m.existingReturn && <Badge tone="outline">{m.existingReturn.status.replace(/_/g, " ")}</Badge>}
              </button>
            ))}
          </div>

          {selected && (
            <div className="flex flex-col gap-3 border border-line p-5">
              <h3 className="font-display text-lg">Resolve Return</h3>
              <Field label="Warehouse (for restock/damaged)">
                <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Refund Amount (for refund)">
                <Input type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
              </Field>
              <Field label="Note (optional)">
                <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-2">
                {RESOLUTIONS.map((r) => (
                  <Button key={r.value} type="button" variant="secondary" size="sm" disabled={busy} onClick={() => handleResolve(r.value)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Link href="/admin/returns" className="text-xs uppercase tracking-wide underline self-start">
        Back to Returns
      </Link>
    </div>
  );
}
