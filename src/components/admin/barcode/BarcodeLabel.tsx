"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export interface BarcodeLabelData {
  brandName: string;
  brandLogoUrl?: string | null;
  productName: string;
  attributes: { name: string; value: string }[];
  sku: string;
  barcode: string | null;
  barcodeType: "CODE128" | "EAN13" | "UPC_A" | "QR" | null;
  price: number;
  currency: string;
}

const GOLD = "#a9803f";
const GOLD_SOFT = "#d8c39a";
const INK = "#14130f";
const INK_SOFT = "#3a3833";
const INK_MUTE = "#6b675e";
const LINE = "#e4ddce";
const PAPER_DIM = "#f1ece2";
const BURGUNDY = "#a3372f";

/**
 * One physical price/barcode sticker — fixed at exactly 60mm x 40mm, the real dimensions of the
 * label stock this prints onto. Every internal measurement uses mm so the label never resizes
 * based on viewport/zoom/browser — see PrintBarcodeLabelsPage for how these get tiled across A4
 * sheets. Colours and fonts are hardcoded to their light-mode values rather than the site's
 * theme-variable classes (text-ink, bg-paper, ...): this is a physical print artifact that must
 * always render identically regardless of whether the admin viewing it currently has dark mode on.
 */
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
      JsBarcode(svgRef.current, data.barcode, { format, width: 2, height: 90, displayValue: false, margin: 0, lineColor: INK });
      // JsBarcode sizes the SVG to its native rendered pixel dimensions and sets a matching
      // viewBox — switching width/height to 100% (keeping that viewBox) lets CSS scale the
      // barcode down to fit the label's fixed mm box while preserving its exact aspect ratio,
      // instead of ever stretching it to fill the container.
      svgRef.current.setAttribute("width", "100%");
      svgRef.current.setAttribute("height", "100%");
      svgRef.current.setAttribute("preserveAspectRatio", "xMidYMid meet");
    } catch {
      // Invalid for the chosen symbology (e.g. a non-numeric code under EAN13/UPC) — render blank rather than crash the sheet.
    }
  }, [data.barcode, data.barcodeType, isQR]);

  return (
    <div
      className="barcode-label flex h-[40mm] w-[60mm] flex-col items-center overflow-hidden text-center"
      style={{ background: "#faf7f2", border: `0.5pt solid ${GOLD_SOFT}`, borderRadius: "2mm" }}
    >
      {/* Top: brand lockup */}
      <div className="mt-[1.2mm] flex items-center gap-[1mm]">
        {data.brandLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.brandLogoUrl} alt={data.brandName} className="h-[3mm] object-contain" />
        )}
        <span className="text-[2mm] font-medium tracking-[0.16em]" style={{ fontFamily: "var(--font-display)", color: INK_SOFT }}>
          {data.brandName}
        </span>
      </div>

      {/* Product name + attributes */}
      <div className="mt-[0.8mm] w-full px-[2.5mm]">
        <p
          className="truncate text-[3.1mm] leading-none"
          style={{ fontFamily: "var(--font-display)", color: INK, fontWeight: 600 }}
          title={data.productName}
        >
          {data.productName}
        </p>
        {data.attributes.length > 0 && (
          <p className="mt-[0.5mm] truncate text-[1.7mm] tracking-[0.08em]" style={{ color: INK_SOFT }}>
            {data.attributes.map((a, i) => (
              <span key={a.name}>
                {i > 0 && (
                  <span className="mx-[0.6mm]" style={{ color: GOLD_SOFT }}>
                    |
                  </span>
                )}
                {a.name.toUpperCase()}: <span style={{ color: GOLD }}>{a.value.toUpperCase()}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Price */}
      <p className="mt-[0.5mm] text-[4mm] font-bold leading-none" style={{ fontFamily: "var(--font-sans)", color: BURGUNDY }}>
        {data.currency} {data.price.toFixed(2)}
      </p>

      {/* Barcode — the dominant element, sized as large as the remaining space allows */}
      <div className="mt-[0.6mm] flex w-full flex-1 flex-col items-center justify-center px-[2.5mm]">
        <div className="flex w-full items-center justify-center" style={{ height: "12mm" }}>
          {data.barcode ? (
            isQR ? <canvas ref={canvasRef} /> : <svg ref={svgRef} className="h-full w-full" />
          ) : (
            <p className="text-[1.8mm]" style={{ color: INK_MUTE }}>
              No barcode assigned
            </p>
          )}
        </div>
        {data.barcode && (
          <p className="mt-[0.3mm] text-[1.8mm] tracking-[0.15em]" style={{ color: INK_SOFT }}>
            {data.barcode}
          </p>
        )}
      </div>

      {/* SKU footer */}
      <div
        className="mt-[0.6mm] w-full border-t px-[2mm] py-[0.7mm] text-[1.7mm] tracking-[0.05em]"
        style={{ borderColor: LINE, background: PAPER_DIM, color: INK_SOFT }}
      >
        <span style={{ color: GOLD }}>SKU</span> {data.sku}
      </div>
    </div>
  );
}
