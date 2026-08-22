"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { SizeGuide } from "@/lib/size-guides";

export function SizeGuideModal({ open, onClose, guide }: { open: boolean; onClose: () => void; guide: SizeGuide }) {
  const [unit, setUnit] = useState<"as-is" | "cm">("as-is");

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Size guide" panelClassName="max-w-lg p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl">{guide.label}</h2>
        {guide.rows.some((r) => /in$/i.test(r.measurements)) && (
          <div className="flex items-center gap-1 text-xs uppercase tracking-[0.1em] text-ink-soft">
            <button onClick={() => setUnit("as-is")} className={cn(unit === "as-is" && "font-semibold text-ink")}>
              in
            </button>
            <span>/</span>
            <button onClick={() => setUnit("cm")} className={cn(unit === "cm" && "font-semibold text-ink")}>
              cm
            </button>
          </div>
        )}
      </div>

      {guide.note && <p className="mb-4 text-sm text-ink-soft">{guide.note}</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-xs uppercase tracking-[0.08em] text-ink-soft">Size</th>
            <th className="py-2 text-xs uppercase tracking-[0.08em] text-ink-soft">Measurements</th>
          </tr>
        </thead>
        <tbody>
          {guide.rows.map((row) => (
            <tr key={row.size} className="border-b border-line/50">
              <td className="py-2 font-medium">{row.size}</td>
              <td className="py-2 text-ink-soft">
                {unit === "cm" ? convertToCm(row.measurements) : row.measurements}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function convertToCm(measurements: string): string {
  return measurements.replace(/(\d+(?:\.\d+)?)in/g, (_, num) => `${Math.round(Number(num) * 2.54)}cm`);
}
