/** Standard GTIN-13 (EAN-13) check-digit algorithm: 0-indexed even positions weight 1, odd weight 3. */
export function ean13CheckDigit(first12Digits: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(first12Digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/** Standard UPC-A check-digit algorithm: 0-indexed even positions weight 3, odd weight 1. */
export function upcACheckDigit(first11Digits: string): number {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += Number(first11Digits[i]) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function validateEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

export function validateUPCA(code: string): boolean {
  if (!/^\d{12}$/.test(code)) return false;
  return upcACheckDigit(code.slice(0, 11)) === Number(code[11]);
}

export function validateBarcodeForType(code: string, type: "CODE128" | "EAN13" | "UPC_A" | "QR"): boolean {
  if (type === "EAN13") return validateEAN13(code);
  if (type === "UPC_A") return validateUPCA(code);
  // CODE128 and QR carry an arbitrary internal identifier — just require non-empty.
  return code.trim().length > 0;
}
