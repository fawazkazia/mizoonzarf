import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatVariantLabel } from "@/lib/inventory/variant-attributes";

function csvEscape(value: unknown): string {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const products = await db.product.findMany({
    include: { category: true, brand: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Product Name", "Product SKU", "Category", "Brand", "Status", "Variant SKU", "Size", "Color", "Attributes", "Price", "Sale Price", "Stock"].join(
      ","
    ),
  ];

  for (const p of products) {
    for (const v of p.variants) {
      rows.push(
        [
          p.name,
          p.sku,
          p.category.name,
          p.brand?.name ?? "",
          p.status,
          v.sku,
          v.size ?? "",
          v.color ?? "",
          formatVariantLabel(v),
          v.price,
          v.salePrice ?? "",
          v.stock,
        ]
          .map(csvEscape)
          .join(",")
      );
    }
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
