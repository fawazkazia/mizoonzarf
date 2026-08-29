import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/currency";
import { formatVariantLabel } from "@/lib/inventory/variant-attributes";
import type { Prisma, ProductStatus } from "@/generated/prisma/client";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { SearchInput } from "@/components/admin/SearchInput";
import { Pagination } from "@/components/admin/Pagination";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Img } from "@/components/ui/ArtImage";
import { ProductRowActions } from "./ProductRowActions";

export const metadata = { title: "Products" };

const PER_PAGE = 20;

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string; stock?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const lowStockOnly = sp.stock === "low";

  const where: Prisma.ProductWhereInput = {};
  if (sp.q) {
    where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { sku: { contains: sp.q, mode: "insensitive" } }];
  }
  if (sp.status) where.status = sp.status as ProductStatus;
  if (lowStockOnly) {
    const lowStockRows = await db.$queryRaw<{ productId: string }[]>`
      SELECT DISTINCT "productId" FROM "product_variants" WHERE stock <= "lowStockThreshold"
    `;
    where.id = { in: lowStockRows.map((r) => r.productId) };
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: true,
        variants: { select: { stock: true, lowStockThreshold: true, attributeValues: true, size: true, color: true, colorHex: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{lowStockOnly ? "Low Stock Products" : "Products"}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name or SKU..." />
        {lowStockOnly && (
          <Link href="/admin/products" className="text-xs uppercase tracking-wide text-sale underline">
            Clear Low Stock Filter
          </Link>
        )}
        <Link href="/admin/products/import" className="text-xs uppercase tracking-wide underline">
          Import CSV
        </Link>
        <a href="/api/admin/products/export" className="text-xs uppercase tracking-wide underline">
          Export CSV
        </a>
        <ButtonLink href="/admin/products/new">+ Add Product</ButtonLink>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 && <EmptyRow colSpan={6}>No products found.</EmptyRow>}
          {products.map((p) => {
            const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
            const lowVariants = p.variants.filter((v) => v.stock <= v.lowStockThreshold);
            return (
              <tr key={p.id}>
                <Td>
                  <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3">
                    <div className="h-12 w-10 shrink-0 bg-paper-dim">
                      <Img src={p.images[0]?.url} alt={p.name} seedFallback={p.id} />
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-ink-soft">{p.sku}</p>
                    </div>
                  </Link>
                </Td>
                <Td>{p.category.name}</Td>
                <Td>{formatINR(Number(p.basePrice))}</Td>
                <Td className={lowVariants.length > 0 ? "text-sale" : ""}>
                  {stock}
                  {lowStockOnly && lowVariants.length > 0 && (
                    <p className="mt-0.5 text-[11px] font-normal normal-case text-ink-soft">
                      {lowVariants
                        .slice(0, 3)
                        .map((v) => `${formatVariantLabel(v) || "Default"}: ${v.stock}`)
                        .join(", ")}
                      {lowVariants.length > 3 ? ` +${lowVariants.length - 3} more` : ""}
                    </p>
                  )}
                </Td>
                <Td>
                  <Badge tone={p.status === "ACTIVE" ? "success" : p.status === "DRAFT" ? "outline" : "ink"}>{p.status}</Badge>
                </Td>
                <Td className="text-right">
                  <ProductRowActions id={p.id} name={p.name} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.max(Math.ceil(total / PER_PAGE), 1)}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.q) params.set("q", sp.q);
          if (sp.status) params.set("status", sp.status);
          if (sp.stock) params.set("stock", sp.stock);
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
