import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { BarcodeLabel } from "@/components/admin/barcode/BarcodeLabel";
import { PrintLabelsButton } from "./PrintLabelsButton";
import { variantAttrs } from "@/lib/inventory/variant-attributes";

export const metadata = { title: "Print Barcode Labels" };

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

// Physical label size, fixed — never derived from viewport/zoom.
const LABEL_W_MM = 60;
const LABEL_H_MM = 40;
const GAP_MM = 5;
// A4 portrait minus the @page 10mm margin on every side = 190mm x 277mm printable area.
// 3 columns of 60mm + 2 gaps of 5mm = 190mm exactly; 6 rows of 40mm + 5 gaps of 5mm = 265mm (fits).
const COLS = 3;
const ROWS = 6;
const PER_PAGE = COLS * ROWS;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export default async function PrintBarcodeLabelsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ids = (sp.ids ?? "").split(",").filter(Boolean);

  const [variants, settings] = await Promise.all([
    db.productVariant.findMany({
      where: { id: { in: ids } },
      include: { product: { select: { name: true } } },
    }),
    getSettings(),
  ]);

  const pages = chunk(variants, PER_PAGE);

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-display text-3xl">Print Barcode Labels</h1>
        <PrintLabelsButton variantIds={variants.map((v) => v.id)} />
      </div>

      {variants.length === 0 && <p className="print:hidden">No variants selected.</p>}
      {variants.length > 0 && (
        <p className="text-xs text-ink-soft print:hidden">
          {variants.length} label{variants.length === 1 ? "" : "s"} — {PER_PAGE} per A4 sheet, {pages.length} sheet
          {pages.length === 1 ? "" : "s"} total. Each label prints at exactly {LABEL_W_MM}mm x {LABEL_H_MM}mm — when the print
          dialog opens, set Paper to A4 and Scale to 100% / Actual Size (not &quot;Fit to page&quot;).
        </p>
      )}

      {/* Real physical print sizing: A4 portrait, 10mm margin, actual size — never scaled to fit. */}
      <style>{`@page { size: A4 portrait; margin: 10mm; }`}</style>

      <div className="flex flex-col items-center gap-8 print:block print:gap-0">
        {pages.map((pageVariants, pageIndex) => (
          <div
            key={pageIndex}
            className={`print-sheet w-[210mm] min-h-[297mm] bg-white p-[10mm] shadow-lg print:w-auto print:min-h-0 print:bg-transparent print:p-0 print:shadow-none ${
              pageIndex < pages.length - 1 ? "break-after-page" : ""
            }`}
          >
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${COLS}, ${LABEL_W_MM}mm)`, gridAutoRows: `${LABEL_H_MM}mm`, gap: `${GAP_MM}mm` }}
            >
              {pageVariants.map((v) => (
                <div key={v.id} style={{ outline: "0.4mm dashed #c3b9a4", outlineOffset: "1.5mm" }}>
                  <BarcodeLabel
                    data={{
                      brandName: settings.brandName,
                      brandLogoUrl: settings.branding.logoUrl || null,
                      productName: v.product.name,
                      attributes: variantAttrs(v),
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
        ))}
      </div>
    </div>
  );
}
