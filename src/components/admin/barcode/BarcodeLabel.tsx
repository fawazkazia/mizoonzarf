"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export interface BarcodeLabelData {
  brandName: string;
  brandLogoUrl?: string | null;
  productName: string;
  size?: string | null;
  color?: string | null;
  sku: string;
  barcode: string | null;
  barcodeType: "CODE128" | "EAN13" | "UPC_A" | "QR" | null;
  price: number;
  currency: string;
}

/** One printable barcode label — 100mm x 50mm, sized for common thermal label printers. */
export function BarcodeLabel({ data }: { data: BarcodeLabelData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isQR = data.barcodeType === "QR";

  useEffect(() => {
    if (!data.barcode) return;
    if (isQR) {
      if (canvasRef.current) QRCode.toCanvas(canvasRef.current, data.barcode, { width: 90, margin: 0 }).catch(() => {});
      return;
    }
    if (!svgRef.current) return;
    const format = data.barcodeType === "EAN13" ? "EAN13" : data.barcodeType === "UPC_A" ? "UPC" : "CODE128";
    try {
      JsBarcode(svgRef.current, data.barcode, { format, width: 1.6, height: 42, displayValue: false, margin: 0 });
    } catch {
      // Invalid for the chosen symbology (e.g. a non-numeric code under EAN13/UPC) — render blank rather than crash the sheet.
    }
  }, [data.barcode, data.barcodeType, isQR]);

  const variantLabel = [data.size ? `Size: ${data.size}` : null, data.color ? `Color: ${data.color}` : null].filter(Boolean).join(" | ");

  return (
    <div className="barcode-label flex h-[50mm] w-[100mm] flex-col items-center justify-between border border-dashed border-ink/20 bg-white p-3 text-center text-ink">
      {data.brandLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.brandLogoUrl} alt={data.brandName} className="h-4 object-contain" />
      ) : (
        <p className="text-[9px] font-medium uppercase tracking-[0.15em]">{data.brandName}</p>
      )}
      <div>
        <p className="text-sm font-medium leading-tight">{data.productName}</p>
        {variantLabel && <p className="text-[10px] text-ink-soft">{variantLabel}</p>}
      </div>
      <p className="text-sm font-medium">
        {data.currency} {data.price.toFixed(2)}
      </p>
      <div className="flex h-11 items-center justify-center">
        {data.barcode ? (
          isQR ? <canvas ref={canvasRef} /> : <svg ref={svgRef} />
        ) : (
          <p className="text-[10px] text-ink-soft">No barcode assigned</p>
        )}
      </div>
      <p className="text-[10px] tracking-widest">{data.barcode ?? "—"}</p>
      <p className="text-[9px] text-ink-soft">SKU: {data.sku}</p>
    </div>
  );
}
