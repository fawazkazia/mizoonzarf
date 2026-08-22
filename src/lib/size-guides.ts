export interface SizeGuideRow {
  size: string;
  measurements: string;
}

export interface SizeGuide {
  label: string;
  note?: string;
  rows: SizeGuideRow[];
}

/**
 * Keyed by the existing free-text Product.sizeGuideType field — no schema
 * change. Extracted from ProductAttributes.tsx (which held only "apparel"
 * and "kids") and extended with footwear/jewellery/fragrance guides so
 * every vertical has a real size/volume reference, not just clothing.
 */
export const SIZE_GUIDES: Record<string, SizeGuide> = {
  apparel: {
    label: "Apparel",
    rows: [
      { size: "XS", measurements: "Chest 34in / Waist 27in" },
      { size: "S", measurements: "Chest 36in / Waist 29in" },
      { size: "M", measurements: "Chest 38in / Waist 31in" },
      { size: "L", measurements: "Chest 40in / Waist 33in" },
      { size: "XL", measurements: "Chest 42in / Waist 35in" },
    ],
  },
  kids: {
    label: "Kids",
    rows: [
      { size: "2-3Y", measurements: "Height 92-98cm" },
      { size: "4-5Y", measurements: "Height 104-110cm" },
      { size: "6-7Y", measurements: "Height 116-122cm" },
      { size: "8-9Y", measurements: "Height 128-134cm" },
    ],
  },
  footwear: {
    label: "Footwear",
    rows: [
      { size: "EU 39", measurements: "UK 6 / US 7 — 24.5cm" },
      { size: "EU 40", measurements: "UK 6.5 / US 7.5 — 25cm" },
      { size: "EU 41", measurements: "UK 7.5 / US 8.5 — 26cm" },
      { size: "EU 42", measurements: "UK 8 / US 9 — 26.5cm" },
      { size: "EU 43", measurements: "UK 9 / US 10 — 27.5cm" },
    ],
  },
  rings: {
    label: "Ring Size",
    note: "Measure an existing ring's inner diameter, or wrap a strip of paper around your finger and measure the circumference.",
    rows: [
      { size: "US 5", measurements: "Diameter 15.7mm / Circumference 49.3mm" },
      { size: "US 6", measurements: "Diameter 16.5mm / Circumference 51.9mm" },
      { size: "US 7", measurements: "Diameter 17.3mm / Circumference 54.4mm" },
      { size: "US 8", measurements: "Diameter 18.1mm / Circumference 57.0mm" },
      { size: "US 9", measurements: "Diameter 19.0mm / Circumference 59.5mm" },
    ],
  },
  bracelets: {
    label: "Bracelet Size",
    note: "Measure your wrist circumference and add 1-1.5cm for a comfortable fit.",
    rows: [
      { size: "S", measurements: "Wrist 14-15cm" },
      { size: "M", measurements: "Wrist 16-17cm" },
      { size: "L", measurements: "Wrist 18-19cm" },
    ],
  },
  perfume: {
    label: "Fragrance Volume Guide",
    note: "Concentration affects both intensity and how long a scent lasts on skin.",
    rows: [
      { size: "30ml", measurements: "Travel size — 4-6 weeks of daily wear" },
      { size: "50ml", measurements: "Everyday size — 2-3 months of daily wear" },
      { size: "100ml", measurements: "Best value — 4-6 months of daily wear" },
    ],
  },
};
