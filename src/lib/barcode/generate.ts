import type { Prisma } from "@/generated/prisma/client";
import { ean13CheckDigit, upcACheckDigit } from "./validate";

/**
 * Atomically increments a named counter and returns the new value — same
 * race-safe upsert pattern as generateInvoiceNumber() in src/lib/orders/invoicing.ts
 * (the upsert's update branch is a row-locked `UPDATE ... SET lastNumber = lastNumber + 1`).
 */
async function nextSequence(tx: Prisma.TransactionClient, prefix: string): Promise<number> {
  const counter = await tx.barcodeCounter.upsert({
    where: { prefix },
    create: { prefix, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return counter.lastNumber;
}

/** Internal Code128 identifier — 12 numeric digits, scans fine on any retail scanner. */
export async function generateCode128(tx: Prisma.TransactionClient): Promise<string> {
  const seq = await nextSequence(tx, "CODE128");
  return String(seq).padStart(12, "0");
}

/**
 * Internal-use EAN-13 in GS1's restricted-circulation range (020–029) — valid
 * within this store, never globally registered, so it can't collide with a
 * real GS1-assigned number if the brand later gets one.
 */
export async function generateEAN13(tx: Prisma.TransactionClient): Promise<string> {
  const seq = await nextSequence(tx, "EAN13");
  const first12 = "02" + String(seq).padStart(10, "0");
  return first12 + String(ean13CheckDigit(first12));
}

/** Internal-use UPC-A — leading "2", the standard in-store/random-weight prefix. */
export async function generateUPCA(tx: Prisma.TransactionClient): Promise<string> {
  const seq = await nextSequence(tx, "UPC_A");
  const first11 = "2" + String(seq).padStart(10, "0");
  return first11 + String(upcACheckDigit(first11));
}

/** QR carries the same kind of internal identifier as Code128 — only the rendered symbology differs. */
export async function generateQRValue(tx: Prisma.TransactionClient): Promise<string> {
  const seq = await nextSequence(tx, "QR");
  return String(seq).padStart(12, "0");
}

export type BarcodeType = "CODE128" | "EAN13" | "UPC_A" | "QR";

export async function generateBarcodeValue(tx: Prisma.TransactionClient, type: BarcodeType): Promise<string> {
  switch (type) {
    case "EAN13":
      return generateEAN13(tx);
    case "UPC_A":
      return generateUPCA(tx);
    case "QR":
      return generateQRValue(tx);
    case "CODE128":
    default:
      return generateCode128(tx);
  }
}
