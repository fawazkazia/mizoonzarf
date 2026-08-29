"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, Th, Td } from "@/components/admin/Table";
import { parseCsvText, buildProductGroups, applyConflicts, type ParseResult, type ProductGroup } from "./parse";
import { downloadTemplate } from "./csv-template";
import { importProductRow, checkImportConflicts } from "../import-actions";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  indent: boolean;
}

interface BrandOption {
  id: string;
  name: string;
}

interface RowResult {
  productSku: string;
  productName: string;
  status: "created" | "updated" | "failed";
  error?: string;
}

type Step = "upload" | "preview" | "importing" | "results";

function downloadCsv(filename: string, fields: string[], data: string[][]) {
  const csv = Papa.unparse({ fields, data });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImportWorkspace({ categories, brands }: { categories: CategoryOption[]; brands: BrandOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [checking, setChecking] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<RowResult[]>([]);

  async function handleFile(file: File) {
    const text = await file.text();
    let rows: Record<string, string>[];
    try {
      rows = parseCsvText(text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't parse this CSV.");
      return;
    }
    if (rows.length === 0) {
      toast.error("This CSV has no data rows.");
      return;
    }

    const parsed = buildProductGroups(rows, categories, brands);
    setParseResult(parsed);
    setChecking(true);
    setStep("preview");
    try {
      const productSkus = parsed.groups.map((g) => g.productSku);
      const variantSkus = parsed.groups.flatMap((g) => g.input.variants.map((v) => v.sku));
      const lookup = await checkImportConflicts(productSkus, variantSkus);
      setGroups(applyConflicts(parsed.groups, lookup));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't check for existing products — showing unresolved results.");
      setGroups(parsed.groups);
    } finally {
      setChecking(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function reset() {
    setStep("upload");
    setParseResult(null);
    setGroups([]);
    setResults([]);
    setExpandedSku(null);
  }

  const validGroups = groups.filter((g) => g.errors.length === 0);
  const hasBlockingErrors = groups.some((g) => g.errors.length > 0);

  async function startImport() {
    setStep("importing");
    setResults([]);
    setProgress({ done: 0, total: validGroups.length });
    for (const g of validGroups) {
      try {
        const res = await importProductRow(g.input);
        setResults((prev) => [...prev, { productSku: g.productSku, productName: g.input.name, status: res.status }]);
      } catch (err) {
        setResults((prev) => [
          ...prev,
          { productSku: g.productSku, productName: g.input.name, status: "failed", error: err instanceof Error ? err.message : "Unknown error." },
        ]);
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setStep("results");
    router.refresh();
  }

  function downloadErrorReport() {
    const failed = results.filter((r) => r.status === "failed");
    if (failed.length === 0) return;
    downloadCsv(
      "product-import-errors.csv",
      ["Product SKU", "Product Name", "Error"],
      failed.map((r) => [r.productSku, r.productName, r.error ?? ""])
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {step === "upload" && (
        <div className="flex flex-col gap-4">
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed p-16 text-center transition-colors ${
              dragOver ? "border-ink bg-paper-dim" : "border-line"
            }`}
          >
            <Upload size={28} className="text-ink-soft" />
            <p className="text-sm">Drag &amp; drop a CSV file here, or</p>
            <label className="cursor-pointer border border-ink px-4 py-2 text-xs uppercase tracking-wide hover:bg-ink hover:text-paper">
              Browse Files
              <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border border-line p-4">
            <div>
              <p className="text-sm font-medium">Need a starting point?</p>
              <p className="text-xs text-ink-soft">
                A template with example rows for T-shirts, shirts, jeans, hoodies, shoes, caps, and a no-variant accessory.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
              Download CSV Template
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
              <span>{groups.length} product(s)</span>
              <span>{groups.filter((g) => g.mode === "create").length} new</span>
              <span>{groups.filter((g) => g.mode === "update").length} update(s)</span>
              {hasBlockingErrors && <span className="text-sale">{groups.filter((g) => g.errors.length > 0).length} with errors</span>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={reset}>
                Start Over
              </Button>
              <Button type="button" size="sm" disabled={checking || hasBlockingErrors || validGroups.length === 0} onClick={startImport}>
                {checking ? "Checking..." : `Start Import (${validGroups.length})`}
              </Button>
            </div>
          </div>

          {parseResult && parseResult.unassignedRowErrors.length > 0 && (
            <div className="border border-sale p-3 text-xs text-sale">
              {parseResult.unassignedRowErrors.map((e) => (
                <p key={e.lineNumber}>
                  Line {e.lineNumber}: {e.message}
                </p>
              ))}
            </div>
          )}

          <Table>
            <thead>
              <tr>
                <Th>Product SKU</Th>
                <Th>Name</Th>
                <Th>Mode</Th>
                <Th>Variants</Th>
                <Th>Status</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.productSku}>
                  <tr>
                    <Td className="font-mono text-xs">{g.productSku}</Td>
                    <Td>{g.input.name || "—"}</Td>
                    <Td>
                      <Badge tone={g.mode === "update" ? "gold" : "success"}>{g.mode}</Badge>
                    </Td>
                    <Td>{g.input.variants.length}</Td>
                    <Td>
                      {g.errors.length > 0 ? (
                        <span className="text-xs text-sale">{g.errors.length} error(s)</span>
                      ) : g.warnings.length > 0 ? (
                        <span className="text-xs text-ink-soft">{g.warnings.length} warning(s)</span>
                      ) : (
                        <span className="text-xs text-success">Ready</span>
                      )}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => setExpandedSku(expandedSku === g.productSku ? null : g.productSku)}
                        className="text-xs underline"
                      >
                        {expandedSku === g.productSku ? "Hide" : "Details"}
                      </button>
                    </Td>
                  </tr>
                  {expandedSku === g.productSku && (
                    <tr>
                      <td colSpan={6} className="border-b border-line bg-paper-dim px-4 py-3">
                        <div className="flex flex-col gap-2 text-xs">
                          {g.errors.map((e, i) => (
                            <p key={`err-${i}`} className="text-sale">
                              {e}
                            </p>
                          ))}
                          {g.warnings.map((w, i) => (
                            <p key={`warn-${i}`} className="text-ink-soft">
                              {w}
                            </p>
                          ))}
                          <ul className="mt-1 flex flex-col gap-1">
                            {g.variantDrafts.map((v, i) => (
                              <li key={`${v.sku}-${i}`}>
                                Line {v.lineNumber} — {v.sku || "(missing SKU)"}
                                {v.errors.length > 0 && <span className="ml-2 text-sale">{v.errors.join("; ")}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {step === "importing" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Importing {progress.done} / {progress.total}...
          </p>
          <div className="h-2 w-full bg-paper-dim">
            <div
              className="h-2 bg-ink transition-all duration-300"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto text-xs">
            {results.map((r, i) => (
              <li key={i} className="flex items-center justify-between border-b border-line py-1.5">
                <span>
                  {r.productSku} — {r.productName}
                </span>
                <Badge tone={r.status === "failed" ? "sale" : r.status === "created" ? "success" : "gold"}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === "results" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-success">{results.filter((r) => r.status === "created").length} created</span>
            <span className="text-gold">{results.filter((r) => r.status === "updated").length} updated</span>
            <span className="text-sale">{results.filter((r) => r.status === "failed").length} failed</span>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Product SKU</Th>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Error</Th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <Td className="font-mono text-xs">{r.productSku}</Td>
                  <Td>{r.productName}</Td>
                  <Td>
                    <Badge tone={r.status === "failed" ? "sale" : r.status === "created" ? "success" : "gold"}>{r.status}</Badge>
                  </Td>
                  <Td className="text-xs text-sale">{r.error ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="flex flex-wrap gap-2">
            {results.some((r) => r.status === "failed") && (
              <Button type="button" variant="secondary" size="sm" onClick={downloadErrorReport}>
                Download Error Report
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={reset}>
              Import Another File
            </Button>
            <ButtonLink href="/admin/products" size="sm">
              Back to Products
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
