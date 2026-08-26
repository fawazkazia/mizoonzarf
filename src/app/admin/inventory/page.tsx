import Link from "next/link";
import { db } from "@/lib/db";
import { InventoryTabs } from "@/components/admin/barcode/InventoryTabs";
import { StatCard } from "@/components/admin/StatCard";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";

export const metadata = { title: "Inventory" };

export default async function InventoryDashboardPage() {
  const [totalBarcodes, activeBarcodes, missingBarcodes, productsWithoutBarcodes, duplicateAttempts, recentScans, printLogs] =
    await Promise.all([
      db.productVariant.count({ where: { barcode: { not: null } } }),
      db.productVariant.count({ where: { barcode: { not: null }, product: { status: "ACTIVE" } } }),
      db.productVariant.count({ where: { barcode: null } }),
      db.product.count({ where: { variants: { some: { barcode: null } } } }),
      db.barcodeDuplicateAttempt.count(),
      db.barcodeScanLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { variant: { include: { product: { select: { name: true } } } }, user: { select: { name: true, email: true } } },
      }),
      db.barcodePrintLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Inventory</h1>
      <InventoryTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Barcodes" value={String(totalBarcodes)} href="/admin/inventory/barcodes" />
        <StatCard label="Active Barcodes" value={String(activeBarcodes)} href="/admin/inventory/barcodes?status=active" />
        <StatCard
          label="Missing Barcodes"
          value={String(missingBarcodes)}
          tone={missingBarcodes > 0 ? "warning" : "default"}
          href="/admin/inventory/barcodes?status=missing"
        />
        <StatCard
          label="Products Without Barcodes"
          value={String(productsWithoutBarcodes)}
          tone={productsWithoutBarcodes > 0 ? "warning" : "default"}
          href="/admin/inventory/barcodes?status=missing"
        />
        <StatCard label="Duplicate Attempts" value={String(duplicateAttempts)} />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="mb-3 font-display text-lg">Recently Scanned</h2>
          <Table>
            <thead>
              <tr>
                <Th>Barcode</Th>
                <Th>Product</Th>
                <Th>Context</Th>
                <Th>By</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {recentScans.length === 0 && <EmptyRow colSpan={5}>No scans yet.</EmptyRow>}
              {recentScans.map((s) => (
                <tr key={s.id}>
                  <Td className={s.found ? "" : "text-sale"}>{s.barcode}</Td>
                  <Td>{s.variant?.product.name ?? "Not found"}</Td>
                  <Td className="text-xs text-ink-soft">{s.context.replace(/_/g, " ")}</Td>
                  <Td className="text-xs">{s.user?.name ?? s.user?.email ?? "—"}</Td>
                  <Td className="text-xs text-ink-soft">{s.createdAt.toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="min-w-0">
          <h2 className="mb-3 font-display text-lg">Print History</h2>
          <Table>
            <thead>
              <tr>
                <Th>Labels</Th>
                <Th>By</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {printLogs.length === 0 && <EmptyRow colSpan={3}>No labels printed yet.</EmptyRow>}
              {printLogs.map((p) => (
                <tr key={p.id}>
                  <Td>{p.labelCount}</Td>
                  <Td className="text-xs">{p.user?.name ?? p.user?.email ?? "—"}</Td>
                  <Td className="text-xs text-ink-soft">{p.createdAt.toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        Need to look up one specific barcode? Use the search box in the top bar, or head to{" "}
        <Link href="/admin/inventory/scan" className="underline">
          Scan
        </Link>
        .
      </p>
    </div>
  );
}
