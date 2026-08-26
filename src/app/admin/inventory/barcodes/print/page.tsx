import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { BarcodeLabel } from "@/components/admin/barcode/BarcodeLabel";
import { PrintLabelsButton } from "./PrintLabelsButton";

export const metadata = { title: "Print Barcode Labels" };

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function PrintBarcodeLabelsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ids = (sp.ids ?? "").split(",").filter(Boolean);

  const [variants, settings] = await Promise.all([
    db.productVariant.findMany({ where: { id: { in: ids } }, include: { product: { select: { name: true } } } }),
    getSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-display text-3xl">Print Barcode Labels</h1>
        <PrintLabelsButton variantIds={variants.map((v) => v.id)} />
      </div>

      {variants.length === 0 && <p className="print:hidden">No variants selected.</p>}

      <style>{`@page { size: 100mm 50mm; margin: 0; }`}</style>

      <div className="flex flex-wrap gap-4 print:gap-0">
        {variants.map((v, i) => (
          <div key={v.id} className={i < variants.length - 1 ? "break-after-page" : undefined}>
            <BarcodeLabel
              data={{
                brandName: settings.brandName,
                brandLogoUrl: settings.branding.logoUrl || null,
                productName: v.product.name,
                size: v.size,
                color: v.color,
                sku: v.sku,
                barcode: v.barcode,
                barcodeType: v.barcodeType,
                price: Number(v.salePrice ?? v.price),
                currency: settings.currencySymbol,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
