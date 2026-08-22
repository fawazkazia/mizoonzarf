import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
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
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const settings = await getSettings();

  const where: Prisma.ProductWhereInput = {};
  if (sp.q) {
    where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { sku: { contains: sp.q, mode: "insensitive" } }];
  }
  if (sp.status) where.status = sp.status as ProductStatus;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true, variants: { select: { stock: true } } },
    }),
    db.product.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Products</h1>
        <ButtonLink href="/admin/products/new">+ Add Product</ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name or SKU..." />
        <a href="/api/admin/products/export" className="text-xs uppercase tracking-wide underline">
          Export CSV
        </a>
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
                <Td>
                  {settings.currencySymbol} {Number(p.basePrice).toFixed(2)}
                </Td>
                <Td className={stock <= 5 ? "text-sale" : ""}>{stock}</Td>
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
          params.set("page", String(p));
          return `?${params.toString()}`;
        }}
      />
    </div>
  );
}
