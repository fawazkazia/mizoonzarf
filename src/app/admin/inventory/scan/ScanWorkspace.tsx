"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ScanInput } from "@/components/admin/barcode/ScanInput";
import { Field, Input, Select } from "@/components/admin/FormField";
import { Button } from "@/components/ui/Button";
import { lookupBarcode, searchVariantsForAssignment } from "../scan-actions";
import { stockIn, stockOut, transferStock } from "../stock-actions";
import { assignManufacturerBarcode } from "../barcode-actions";
import type { BarcodeType } from "@/generated/prisma/client";

type LookupResult = Awaited<ReturnType<typeof lookupBarcode>>;
type AssignCandidate = Awaited<ReturnType<typeof searchVariantsForAssignment>>[number];

export function ScanWorkspace({ warehouses }: { warehouses: { id: string; name: string }[] }) {
  const [lastCode, setLastCode] = useState("");
  const [result, setResult] = useState<LookupResult | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState("1");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [transferQty, setTransferQty] = useState("1");
  const [transferTo, setTransferTo] = useState(warehouses[1]?.id ?? "");
  const [transferBusy, setTransferBusy] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignQuery, setAssignQuery] = useState("");
  const [assignType, setAssignType] = useState<BarcodeType>("CODE128");
  const [assignCandidates, setAssignCandidates] = useState<AssignCandidate[]>([]);

  async function runScan(code: string) {
    setLastCode(code);
    setLoading(true);
    setAssigning(false);
    setAssignCandidates([]);
    setAssignQuery("");
    try {
      const found = await lookupBarcode(code, "GENERAL_SEARCH");
      setResult(found);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignSearch(query: string) {
    setAssignQuery(query);
    if (query.trim().length < 2) {
      setAssignCandidates([]);
      return;
    }
    try {
      setAssignCandidates(await searchVariantsForAssignment(query));
    } catch {
      // silent — search-as-you-type shouldn't toast on every keystroke
    }
  }

  async function handleAssign(variantId: string) {
    try {
      await assignManufacturerBarcode(variantId, lastCode, assignType);
      toast.success("Barcode assigned.");
      await runScan(lastCode);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't assign barcode.");
    }
  }

  async function handleStockChange(direction: "in" | "out") {
    if (!result) return;
    const quantity = Number(qty);
    if (!quantity || quantity <= 0) {
      toast.error("Enter a quantity greater than zero.");
      return;
    }
    setBusy(true);
    try {
      if (direction === "in") await stockIn(result.variant.id, warehouseId, quantity, reason || undefined);
      else await stockOut(result.variant.id, warehouseId, quantity, reason || undefined);
      toast.success(direction === "in" ? `+${quantity} stocked in.` : `-${quantity} stocked out.`);
      setReason("");
      await runScan(lastCode);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update stock.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTransfer() {
    if (!result) return;
    const quantity = Number(transferQty);
    if (!quantity || quantity <= 0) {
      toast.error("Enter a quantity greater than zero.");
      return;
    }
    if (!transferTo || transferTo === warehouseId) {
      toast.error("Choose a different destination warehouse.");
      return;
    }
    setTransferBusy(true);
    try {
      await transferStock(result.variant.id, warehouseId, transferTo, quantity);
      toast.success(`Transferred ${quantity} unit(s).`);
      await runScan(lastCode);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't transfer stock.");
    } finally {
      setTransferBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ScanInput onScan={runScan} />

      {loading && <p className="text-sm text-ink-soft">Looking up {lastCode}...</p>}

      {!loading && result === null && (
        <div className="border border-sale/40 bg-sale/5 p-6 text-center">
          <p className="font-display text-lg text-sale">Barcode not found</p>
          <p className="mt-1 text-sm text-ink-soft">&ldquo;{lastCode}&rdquo; doesn&apos;t match any variant.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/admin/products/new" className="text-xs uppercase tracking-wide underline">
              Create Product
            </Link>
            <button type="button" className="text-xs uppercase tracking-wide underline" onClick={() => setAssigning((v) => !v)}>
              Assign Barcode
            </button>
            <Link href={`/admin/products?q=${encodeURIComponent(lastCode)}`} className="text-xs uppercase tracking-wide underline">
              Search Manually
            </Link>
          </div>

          {assigning && (
            <div className="mx-auto mt-4 max-w-md text-left">
              <div className="flex gap-2">
                <Input
                  placeholder="Search product or SKU to assign this barcode to..."
                  value={assignQuery}
                  onChange={(e) => handleAssignSearch(e.target.value)}
                />
                <Select value={assignType} onChange={(e) => setAssignType(e.target.value as BarcodeType)} className="w-auto">
                  <option value="CODE128">Code 128</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="UPC_A">UPC-A</option>
                </Select>
              </div>
              {assignCandidates.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 border border-line bg-paper-raise">
                  {assignCandidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleAssign(c.id)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-paper-dim"
                      >
                        {c.productName} — {[c.size, c.color].filter(Boolean).join(" / ") || "Default"}{" "}
                        <span className="text-xs text-ink-soft">({c.sku})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && result && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="border border-line p-5">
            <p className="text-xs uppercase tracking-wide text-ink-soft">{result.product.status}</p>
            <h2 className="font-display text-xl">{result.product.name}</h2>
            <p className="text-sm text-ink-soft">
              {[result.variant.size, result.variant.color].filter(Boolean).join(" / ") || "Default"} · SKU {result.variant.sku}
            </p>
            <p className="mt-2 text-lg font-medium">
              {result.variant.salePrice ?? result.variant.price}
              {result.variant.salePrice && <span className="ml-2 text-sm text-ink-soft line-through">{result.variant.price}</span>}
            </p>
            <p className="mt-1 text-sm">
              Total stock: <span className="font-medium">{result.variant.stock}</span>
              {result.variant.stock <= result.variant.lowStockThreshold && <span className="ml-2 text-xs text-sale">Low stock</span>}
            </p>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="py-1">Warehouse</th>
                  <th className="py-1 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {result.warehouseStocks.map((ws) => (
                  <tr key={ws.warehouseId} className="border-t border-line">
                    <td className="py-1.5">{ws.warehouseName}</td>
                    <td className="py-1.5 text-right">{ws.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Link href={`/admin/products/${result.product.id}/edit`} className="mt-4 inline-block text-xs uppercase tracking-wide underline">
              Open Product
            </Link>
          </div>

          <div className="flex flex-col gap-3 border border-line p-5">
            <h3 className="font-display text-lg">Stock In / Out</h3>
            <Field label="Warehouse">
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quantity">
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Reason (optional)">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Cycle count adjustment" />
            </Field>
            <div className="flex gap-2">
              <Button type="button" disabled={busy} onClick={() => handleStockChange("in")} className="flex-1">
                Stock In (+{qty || 0})
              </Button>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => handleStockChange("out")} className="flex-1">
                Stock Out (-{qty || 0})
              </Button>
            </div>

            {warehouses.length > 1 && (
              <>
                <h3 className="mt-2 font-display text-lg">Transfer Stock</h3>
                <p className="text-xs text-ink-soft">From {warehouses.find((w) => w.id === warehouseId)?.name ?? "—"} to:</p>
                <Field label="Destination Warehouse">
                  <Select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                    {warehouses
                      .filter((w) => w.id !== warehouseId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Quantity">
                  <Input type="number" min={1} value={transferQty} onChange={(e) => setTransferQty(e.target.value)} />
                </Field>
                <Button type="button" variant="secondary" disabled={transferBusy} onClick={handleTransfer}>
                  Transfer {transferQty || 0} Unit(s)
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
