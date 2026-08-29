"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { generateBarcode, regenerateBarcode, deactivateBarcode, bulkGenerateBarcodes } from "../barcode-actions";
import type { BarcodeType, BarcodeSource, ProductStatus } from "@/generated/prisma/client";

interface Row {
  id: string;
  productId: string;
  productName: string;
  productStatus: ProductStatus;
  sku: string;
  variantLabel: string;
  barcode: string | null;
  barcodeType: BarcodeType | null;
  barcodeSource: BarcodeSource | null;
}

export function BarcodeManagementTable({ variants }: { variants: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === variants.length ? new Set() : new Set(variants.map((v) => v.id))));
  }

  async function handleGenerate(row: Row) {
    setBusyId(row.id);
    try {
      if (row.barcode) await regenerateBarcode(row.id);
      else await generateBarcode(row.id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate barcode.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeactivate(row: Row) {
    if (!confirm(`Remove the barcode from ${row.productName} (${row.sku})?`)) return;
    setBusyId(row.id);
    try {
      await deactivateBarcode(row.id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove barcode.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleBulkGenerate() {
    setBulkBusy(true);
    try {
      const result = await bulkGenerateBarcodes([...selected]);
      toast.success(`Generated ${result.generated} barcode(s).`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate barcodes.");
    } finally {
      setBulkBusy(false);
    }
  }

  const selectedIds = [...selected];

  return (
    <div className="flex flex-col gap-3">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 border border-line bg-paper-dim px-4 py-3">
          <span className="text-xs uppercase tracking-wide text-ink-soft">{selectedIds.length} selected</span>
          <Button type="button" size="sm" variant="secondary" disabled={bulkBusy} onClick={handleBulkGenerate}>
            Generate Barcodes
          </Button>
          <Link
            href={`/admin/inventory/barcodes/print?ids=${selectedIds.join(",")}`}
            className="text-xs uppercase tracking-wide underline"
          >
            Print Selected Labels / Download PDF
          </Link>
        </div>
      )}

      <Table>
        <thead>
          <tr>
            <Th>
              <input type="checkbox" checked={selected.size === variants.length && variants.length > 0} onChange={toggleAll} />
            </Th>
            <Th>Product</Th>
            <Th>Variant</Th>
            <Th>SKU</Th>
            <Th>Barcode</Th>
            <Th>Type</Th>
            <Th>Source</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {variants.length === 0 && <EmptyRow colSpan={8}>No variants found.</EmptyRow>}
          {variants.map((row) => (
            <tr key={row.id}>
              <Td>
                <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
              </Td>
              <Td>
                <Link href={`/admin/products/${row.productId}/edit`} className="hover:underline">
                  {row.productName}
                </Link>
              </Td>
              <Td>{row.variantLabel || "Default"}</Td>
              <Td className="text-xs">{row.sku}</Td>
              <Td className="font-mono text-xs">{row.barcode ?? <span className="text-sale">Missing</span>}</Td>
              <Td className="text-xs">{row.barcodeType ?? "—"}</Td>
              <Td>
                {row.barcodeSource && (
                  <Badge tone={row.barcodeSource === "MANUFACTURER" ? "gold" : "outline"}>{row.barcodeSource}</Badge>
                )}
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-3 text-xs">
                  <button className="underline" disabled={busyId === row.id} onClick={() => handleGenerate(row)}>
                    {row.barcode ? "Regenerate" : "Generate"}
                  </button>
                  {row.barcode && (
                    <>
                      <Link href={`/admin/inventory/barcodes/print?ids=${row.id}`} className="underline">
                        Download
                      </Link>
                      <button className="text-sale underline" disabled={busyId === row.id} onClick={() => handleDeactivate(row)}>
                        Deactivate
                      </button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
