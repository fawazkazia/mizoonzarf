import { db } from "@/lib/db";
import type { Prisma, StockMovementType } from "@/generated/prisma/client";
import { InventoryTabs } from "@/components/admin/barcode/InventoryTabs";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { Pagination } from "@/components/admin/Pagination";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";

export const metadata = { title: "Stock Movements" };

const PER_PAGE = 40;
const TYPES: StockMovementType[] = [
  "RECEIVE",
  "STOCK_IN",
  "STOCK_OUT",
  "ADJUSTMENT",
  "ORDER_RESERVED",
  "ORDER_FULFILLED",
  "ORDER_CANCELLED_RELEASE",
  "RETURN_RESTOCK",
  "RETURN_DAMAGED",
  "TRANSFER_OUT",
  "TRANSFER_IN",
];

interface PageProps {
  searchParams: Promise<{ status?: string; warehouseId?: string; page?: string }>;
}

export default async function StockMovementsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const where: Prisma.StockMovementWhereInput = {};
  if (sp.status) where.type = sp.status as StockMovementType;
  if (sp.warehouseId) where.warehouseId = sp.warehouseId;

  const [movements, total, warehouses] = await Promise.all([
    db.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        variant: { include: { product: { select: { name: true } } } },
        warehouse: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    db.stockMovement.count({ where }),
    db.warehouse.findMany({ orderBy: { isDefault: "desc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Stock Movements</h1>
      <InventoryTabs />

      <div className="flex flex-wrap items-center gap-3">
        <StatusFilterSelect options={TYPES} />
        {warehouses.length > 1 && (
          <span className="text-xs text-ink-soft">{warehouses.length} warehouses</span>
        )}
      </div>

      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Product</Th>
            <Th>Type</Th>
            <Th className="text-right">Qty</Th>
            <Th className="text-right">Before → After</Th>
            <Th>Warehouse</Th>
            <Th>Reason</Th>
            <Th>By</Th>
          </tr>
        </thead>
        <tbody>
          {movements.length === 0 && <EmptyRow colSpan={8}>No stock movements yet.</EmptyRow>}
          {movements.map((m) => (
            <tr key={m.id}>
              <Td className="text-xs text-ink-soft">{m.createdAt.toLocaleString()}</Td>
              <Td>
                {m.variant.product.name}
                <span className="ml-1 text-xs text-ink-soft">
                  {[m.variant.size, m.variant.color].filter(Boolean).join("/")}
                </span>
              </Td>
              <Td className="text-xs">{m.type.replace(/_/g, " ")}</Td>
              <Td className={`text-right ${m.quantity < 0 ? "text-sale" : "text-success"}`}>
                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
              </Td>
              <Td className="text-right text-xs text-ink-soft">
                {m.previousStock} → {m.newStock}
              </Td>
              <Td className="text-xs">{m.warehouse.name}</Td>
              <Td className="text-xs text-ink-soft">{m.reason ?? "—"}</Td>
              <Td className="text-xs">{m.user?.name ?? m.user?.email ?? "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.max(Math.ceil(total / PER_PAGE), 1)}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.status) params.set("status", sp.status);
          if (sp.warehouseId) params.set("warehouseId", sp.warehouseId);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
