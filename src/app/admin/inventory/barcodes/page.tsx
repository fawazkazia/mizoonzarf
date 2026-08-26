import { db } from "@/lib/db";
import type { Prisma, BarcodeType } from "@/generated/prisma/client";
import { InventoryTabs } from "@/components/admin/barcode/InventoryTabs";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { BarcodeManagementTable } from "./BarcodeManagementTable";

export const metadata = { title: "Barcode Management" };

const PER_PAGE = 30;

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }>;
}

export default async function BarcodeManagementPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const where: Prisma.ProductVariantWhereInput = {};
  if (sp.q) {
    where.OR = [
      { sku: { contains: sp.q, mode: "insensitive" } },
      { barcode: { contains: sp.q, mode: "insensitive" } },
      { product: { name: { contains: sp.q, mode: "insensitive" } } },
    ];
  }
  if (sp.status === "missing") where.barcode = null;
  if (sp.status === "active" || sp.status === "assigned") where.barcode = { not: null };
  if (sp.type) where.barcodeType = sp.type as BarcodeType;

  const [variants, total] = await Promise.all([
    db.productVariant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { product: { select: { id: true, name: true, slug: true, status: true } } },
    }),
    db.productVariant.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Barcode Management</h1>
      <InventoryTabs />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search product, SKU, or barcode..." />
        <StatusFilterSelect options={["missing", "assigned"]} />
      </div>

      <BarcodeManagementTable
        variants={variants.map((v) => ({
          id: v.id,
          productId: v.product.id,
          productName: v.product.name,
          productStatus: v.product.status,
          sku: v.sku,
          size: v.size,
          color: v.color,
          barcode: v.barcode,
          barcodeType: v.barcodeType,
          barcodeSource: v.barcodeSource,
        }))}
      />

      <Pagination
        page={page}
        totalPages={Math.max(Math.ceil(total / PER_PAGE), 1)}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.q) params.set("q", sp.q);
          if (sp.status) params.set("status", sp.status);
          if (sp.type) params.set("type", sp.type);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
