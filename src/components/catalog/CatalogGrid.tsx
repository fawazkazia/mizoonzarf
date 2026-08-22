"use client";

import { useEffect } from "react";
import { useGridDensityStore } from "@/stores/grid-density-store";
import { cn } from "@/lib/utils";

/**
 * Client wrapper applying the grid-density class only — `children` (server-
 * rendered ProductCards) pass straight through, so no product data crosses
 * into the client bundle just to render this grid.
 */
export function CatalogGrid({ children }: { children: React.ReactNode }) {
  const density = useGridDensityStore((s) => s.density);

  useEffect(() => {
    useGridDensityStore.persist.rehydrate();
  }, []);

  return (
    <div
      className={cn(
        "grid",
        density === "compact"
          ? "grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 xl:grid-cols-4"
      )}
    >
      {children}
    </div>
  );
}
