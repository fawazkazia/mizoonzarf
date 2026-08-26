"use client";

import { Button } from "@/components/ui/Button";
import { logPrint } from "../../barcode-actions";

export function PrintLabelsButton({ variantIds }: { variantIds: string[] }) {
  return (
    <Button
      onClick={async () => {
        await logPrint(variantIds);
        window.print();
      }}
      className="print:hidden"
      disabled={variantIds.length === 0}
    >
      Print / Save as PDF
    </Button>
  );
}
