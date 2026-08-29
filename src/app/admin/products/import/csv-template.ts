import Papa from "papaparse";
import { CSV_COLUMNS } from "./parse";

type Row = Record<(typeof CSV_COLUMNS)[number], string>;

function row(values: Partial<Row>): Row {
  const r = {} as Row;
  for (const col of CSV_COLUMNS) r[col] = values[col] ?? "";
  return r;
}

/** Example rows covering every category the template needs to demonstrate: Size+Colour basics,
 * a Size+Colour+Fit shirt, a non-cartesian Waist×Length×Colour×Fit jeans (mirrors the seed's
 * "Relaxed Straight Jeans" fixture — not every combination is stocked), a Shoe Size×Colour×Width
 * shoe, a Size+Colour+Style cap, and a no-variant accessory (empty Attributes, one row). */
const TEMPLATE_ROWS: Row[] = [
  // --- T-shirt: Size + Colour ---
  row({
    "Product SKU": "TSHIRT-001",
    "Product Name": "Classic Cotton Crew Tee",
    Category: "mens-tshirts",
    Brand: "Solstice",
    Gender: "MEN",
    Status: "ACTIVE",
    Description: "Heavyweight combed cotton crewneck tee, a wardrobe staple built to last.",
    "Short Description": "Heavyweight combed cotton crewneck tee.",
    Material: "100% Combed Cotton",
    "Care Instructions": "Machine wash cold with like colours.",
    Tags: "casual;minimal",
    Images: "https://example.com/images/tshirt-1.jpg;https://example.com/images/tshirt-2.jpg",
    "Variant SKU": "TSHIRT-001-S-BLK",
    Attributes: "Size:S|Colour:Black",
    "Colour Hex": "#1c1b19",
    Price: "1799",
    Stock: "20",
    "Low Stock Alert": "5",
  }),
  row({ "Product SKU": "TSHIRT-001", "Variant SKU": "TSHIRT-001-M-BLK", Attributes: "Size:M|Colour:Black", "Colour Hex": "#1c1b19", Price: "1799", Stock: "25" }),
  row({ "Product SKU": "TSHIRT-001", "Variant SKU": "TSHIRT-001-M-WHT", Attributes: "Size:M|Colour:White", "Colour Hex": "#f5f3ee", Price: "1799", Stock: "18" }),
  row({ "Product SKU": "TSHIRT-001", "Variant SKU": "TSHIRT-001-L-WHT", Attributes: "Size:L|Colour:White", "Colour Hex": "#f5f3ee", Price: "1799", Stock: "15" }),

  // --- Shirt: Size + Colour + Fit ---
  row({
    "Product SKU": "SHIRT-001",
    "Product Name": "Poplin Button-Down Shirt",
    Category: "mens-shirts",
    Brand: "Aurelia House",
    Gender: "MEN",
    Status: "ACTIVE",
    Description: "A crisp, tailored shirt cut from breathable cotton poplin with a modern slim fit.",
    "Short Description": "Cotton poplin shirt with a modern slim fit.",
    Material: "100% Cotton Poplin",
    "Fit Info": "Slim fit — true to size.",
    Tags: "office;classic",
    Images: "https://example.com/images/shirt-1.jpg",
    "Variant SKU": "SHIRT-001-S-BLU-SLIM",
    Attributes: "Size:S|Colour:Sky Blue|Fit:Slim",
    "Colour Hex": "#a9c3d4",
    Price: "5999",
    Stock: "12",
  }),
  row({ "Product SKU": "SHIRT-001", "Variant SKU": "SHIRT-001-M-BLU-SLIM", Attributes: "Size:M|Colour:Sky Blue|Fit:Slim", "Colour Hex": "#a9c3d4", Price: "5999", Stock: "14" }),
  row({ "Product SKU": "SHIRT-001", "Variant SKU": "SHIRT-001-M-WHT-REG", Attributes: "Size:M|Colour:White|Fit:Regular", "Colour Hex": "#f5f3ee", Price: "5999", Stock: "10" }),

  // --- Jeans: Waist + Length/Inseam + Colour + Fit, non-cartesian ---
  row({
    "Product SKU": "JEANS-001",
    "Product Name": "Relaxed Straight-Fit Denim",
    Category: "mens-jeans",
    Brand: "Velure",
    Gender: "MEN",
    Status: "ACTIVE",
    Description: "Relaxed straight-leg jeans in rigid cotton denim, available in a curated set of waist and length combinations.",
    "Short Description": "Relaxed straight-leg rigid denim jeans.",
    Material: "100% Cotton Denim",
    "Fit Info": "Relaxed straight fit.",
    Images: "https://example.com/images/jeans-1.jpg",
    "Variant SKU": "JEANS-001-30-30-BLK",
    Attributes: "Waist:30|Length/Inseam:30|Colour:Black|Fit:Relaxed",
    "Colour Hex": "#1c1b19",
    Price: "6499",
    Stock: "8",
  }),
  // Note: not every waist pairs with every length — only the combinations actually stocked are listed.
  row({ "Product SKU": "JEANS-001", "Variant SKU": "JEANS-001-32-30-BLK", Attributes: "Waist:32|Length/Inseam:30|Colour:Black|Fit:Relaxed", "Colour Hex": "#1c1b19", Price: "6499", Stock: "10" }),
  row({ "Product SKU": "JEANS-001", "Variant SKU": "JEANS-001-32-32-BLU", Attributes: "Waist:32|Length/Inseam:32|Colour:Blue|Fit:Relaxed", "Colour Hex": "#2c3648", Price: "6499", Stock: "9" }),
  row({ "Product SKU": "JEANS-001", "Variant SKU": "JEANS-001-34-32-BLU", Attributes: "Waist:34|Length/Inseam:32|Colour:Blue|Fit:Relaxed", "Colour Hex": "#2c3648", Price: "6499", Stock: "7" }),

  // --- Hoodie: Size + Colour ---
  row({
    "Product SKU": "HOODIE-001",
    "Product Name": "Fleece Pullover Hoodie",
    Category: "mens-shirts",
    Gender: "MEN",
    Status: "ACTIVE",
    Description: "Brushed-fleece pullover hoodie with a kangaroo pocket and ribbed cuffs.",
    "Short Description": "Brushed-fleece pullover hoodie.",
    Material: "80% Cotton, 20% Polyester",
    Images: "https://example.com/images/hoodie-1.jpg",
    "Variant SKU": "HOODIE-001-M-GRY",
    Attributes: "Size:M|Colour:Grey",
    "Colour Hex": "#8a8a86",
    Price: "3499",
    Stock: "16",
  }),
  row({ "Product SKU": "HOODIE-001", "Variant SKU": "HOODIE-001-L-GRY", Attributes: "Size:L|Colour:Grey", "Colour Hex": "#8a8a86", Price: "3499", Stock: "14" }),
  row({ "Product SKU": "HOODIE-001", "Variant SKU": "HOODIE-001-L-BLK", Attributes: "Size:L|Colour:Black", "Colour Hex": "#1c1b19", Price: "3499", Stock: "11" }),

  // --- Shoes: Shoe Size + Colour + Width ---
  row({
    "Product SKU": "SHOE-001",
    "Product Name": "Leather Oxford Shoe",
    Category: "mens-accessories",
    Brand: "Étoile",
    Gender: "MEN",
    Status: "ACTIVE",
    Description: "A hand-finished leather derby shoe with a durable rubber sole, built for everyday wear.",
    "Short Description": "Hand-finished leather derby shoe.",
    Material: "Full-Grain Leather",
    Images: "https://example.com/images/shoe-1.jpg",
    "Variant SKU": "SHOE-001-9-BRN-REG",
    Attributes: "Shoe Size:9|Colour:Brown|Width:Regular",
    "Colour Hex": "#5c3a21",
    Price: "8999",
    Stock: "6",
  }),
  row({ "Product SKU": "SHOE-001", "Variant SKU": "SHOE-001-10-BRN-REG", Attributes: "Shoe Size:10|Colour:Brown|Width:Regular", "Colour Hex": "#5c3a21", Price: "8999", Stock: "8" }),
  row({ "Product SKU": "SHOE-001", "Variant SKU": "SHOE-001-10-BRN-WIDE", Attributes: "Shoe Size:10|Colour:Brown|Width:Wide", "Colour Hex": "#5c3a21", Price: "8999", Stock: "3" }),

  // --- Cap: Size + Colour + Style ---
  row({
    "Product SKU": "CAP-001",
    "Product Name": "Structured Baseball Cap",
    Category: "mens-accessories",
    Brand: "Solstice",
    Gender: "UNISEX",
    Status: "ACTIVE",
    Description: "A structured six-panel cap with an adjustable strap back.",
    "Short Description": "Structured six-panel baseball cap.",
    Material: "100% Cotton Twill",
    Images: "https://example.com/images/cap-1.jpg",
    "Variant SKU": "CAP-001-OS-BLK-STRUCT",
    Attributes: "Size:One Size|Colour:Black|Style:Structured",
    "Colour Hex": "#1c1b19",
    Price: "1499",
    Stock: "30",
  }),
  row({ "Product SKU": "CAP-001", "Variant SKU": "CAP-001-OS-NVY-STRUCT", Attributes: "Size:One Size|Colour:Navy|Style:Structured", "Colour Hex": "#22314a", Price: "1499", Stock: "22" }),

  // --- No-variant accessory ---
  row({
    "Product SKU": "SCARF-001",
    "Product Name": "Silk Twill Scarf",
    Category: "womens-accessories",
    Gender: "WOMEN",
    Status: "ACTIVE",
    Description: "A single-size silk twill scarf, finished with hand-rolled edges — no variants needed.",
    "Short Description": "Hand-rolled silk twill scarf.",
    Material: "100% Silk",
    Images: "https://example.com/images/scarf-1.jpg",
    "Variant SKU": "SCARF-001",
    Price: "1999",
    Stock: "15",
  }),
];

export function buildTemplateCsv(): string {
  return Papa.unparse({ fields: [...CSV_COLUMNS], data: TEMPLATE_ROWS });
}

export function downloadTemplate() {
  const csv = buildTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-import-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
