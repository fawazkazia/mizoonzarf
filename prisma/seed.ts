import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Gender, type BannerPosition, type PromotionType, type DiscountType, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { deriveMirrorFields, type VariantAttr } from "../src/lib/inventory/variant-attributes";
import { DEFAULT_CHART_OF_ACCOUNTS } from "../src/lib/finance/accounts";
import { seedSystemStaffRoles } from "../src/lib/permissions/seed-system-roles";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function art(seed: string, kind: string, label?: string, caption?: string, format?: "png") {
  const params = new URLSearchParams({ seed, kind });
  if (label) params.set("label", label);
  if (caption) params.set("caption", caption);
  if (format) params.set("format", format);
  return `/api/art?${params.toString()}`;
}

function banner(path: string) {
  return `/images/banners/${path}`;
}

/** Dummy photography for homepage/nav sections — keyed by category slug so
 * both top-level categories and the specific children MEGA_MENU_CONFIG picks
 * as a vertical's feature image get a real photo instead of generated art. */
const CATEGORY_IMAGES: Record<string, string> = {
  men: banner("category-men.jpg"),
  women: banner("category-women.jpg"),
  kids: banner("category-kids.jpg"),
  perfumes: banner("category-perfumes.jpg"),
  jewellery: banner("category-jewellery.jpg"),
  "mens-traditional": banner("mega-mens-traditional.jpg"),
  "womens-dresses": banner("mega-womens-dresses.jpg"),
  "perfumes-women": banner("mega-perfumes-women.jpg"),
  "jewellery-necklaces": banner("mega-jewellery-necklaces.jpg"),
};

const HERO_IMAGES = [
  banner("hero-newseason.jpg"),
  banner("hero-men.jpg"),
  banner("hero-women.jpg"),
  banner("hero-perfume.jpg"),
  banner("hero-kids.jpg"),
  banner("hero-sale.jpg"),
];

const COLLECTION_IMAGES: Record<string, string> = {
  "wedding-edit": banner("collection-wedding-edit.jpg"),
  "summer-collection": banner("collection-summer.jpg"),
  "new-season": banner("collection-new-season.jpg"),
  "perfume-edit": banner("collection-perfume-edit.jpg"),
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const BRANDS = ["Aurelia House", "Maison Noir", "Velure", "Solstice", "Casa Bloom", "Étoile"];

interface VariantSpec {
  attributes: VariantAttr[];
  price: number;
  salePrice?: number;
  stock: number;
}

interface AttributeDefSpec {
  name: string;
  isColor?: boolean;
  values: { value: string; hex?: string }[];
}

interface CustomVariantSpec {
  attributes: VariantAttr[];
  price?: number;
  salePrice?: number;
  stock?: number;
}

interface ProductSpec {
  name: string;
  categorySlug: string;
  brand: string;
  gender: Gender;
  price: number;
  description: string;
  shortDescription: string;
  tags: string[];
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  saleSizes?: string[];
  /** Explicit variant list, bypassing the sizes×colors cartesian helper below — for fixtures
   * exercising attributes beyond Size/Colour, or asymmetric (non-cartesian) combinations. */
  customVariants?: CustomVariantSpec[];
  /** Attribute definitions to pair with customVariants. Ignored (auto-derived from sizes/colors
   * instead) when customVariants is unset. */
  variantAttributeDefs?: AttributeDefSpec[];
  material?: string;
  fitInfo?: string;
  careInstructions?: string;
  sizeGuideType?: string;
  fragranceFamily?: string;
  fragranceNotes?: { top?: string[]; heart?: string[]; base?: string[] };
  concentration?: string;
  collections?: string[];
  isFeatured?: boolean;
}

function buildVariants(spec: ProductSpec, skuBase: string): VariantSpec[] {
  if (spec.customVariants) {
    return spec.customVariants.map((cv) => ({
      attributes: cv.attributes,
      price: cv.price ?? spec.price,
      salePrice: cv.salePrice,
      stock: cv.stock ?? 5 + Math.floor((skuBase.length * 7) % 20),
    }));
  }

  const sizes = spec.sizes?.length ? spec.sizes : [undefined];
  const colors = spec.colors?.length ? spec.colors : [undefined];
  const variants: VariantSpec[] = [];

  for (const size of sizes) {
    for (const color of colors) {
      const onSale = spec.saleSizes?.includes(size ?? "");
      const attributes: VariantAttr[] = [];
      if (size) attributes.push({ name: "Size", value: size });
      if (color) attributes.push({ name: "Colour", value: color.name, hex: color.hex });
      variants.push({
        attributes,
        price: spec.price,
        salePrice: onSale ? Math.round(spec.price * 0.7 * 100) / 100 : undefined,
        stock: 5 + Math.floor((skuBase.length * 7) % 20),
      });
    }
  }
  return variants;
}

/** Product-level attribute definitions to pair with buildVariants — auto-derived from
 * sizes/colors for the common case, or taken verbatim for customVariants fixtures. */
function buildAttributeDefs(spec: ProductSpec): AttributeDefSpec[] {
  if (spec.variantAttributeDefs) return spec.variantAttributeDefs;
  const defs: AttributeDefSpec[] = [];
  if (spec.sizes?.length) defs.push({ name: "Size", values: spec.sizes.map((value) => ({ value })) });
  if (spec.colors?.length) defs.push({ name: "Colour", isColor: true, values: spec.colors.map((c) => ({ value: c.name, hex: c.hex })) });
  return defs;
}

const PRODUCTS: ProductSpec[] = [
  // ---- MEN ----
  {
    name: "Tailored Slim-Fit Shirt",
    categorySlug: "mens-shirts",
    brand: "Aurelia House",
    gender: "MEN",
    price: 5999,
    description: "A crisp, tailored shirt cut from breathable cotton poplin with a modern slim fit through the body and sleeve.",
    shortDescription: "Cotton poplin shirt with a modern slim fit.",
    tags: ["office", "classic", "wedding"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "White", hex: "#f5f3ee" }, { name: "Sky Blue", hex: "#a9c3d4" }, { name: "Navy", hex: "#22314a" }],
    saleSizes: ["M", "L"],
    material: "100% Cotton Poplin",
    fitInfo: "Slim fit — true to size.",
    careInstructions: "Machine wash cold, iron on medium heat.",
    sizeGuideType: "apparel",
    isFeatured: true,
  },
  {
    name: "Essential Crewneck T-Shirt",
    categorySlug: "mens-tshirts",
    brand: "Solstice",
    gender: "MEN",
    price: 1799,
    description: "Our signature crewneck tee in heavyweight combed cotton — a wardrobe staple built to last.",
    shortDescription: "Heavyweight combed cotton crewneck tee.",
    tags: ["casual", "minimal"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#1c1b19" }, { name: "White", hex: "#f5f3ee" }, { name: "Stone", hex: "#b8ab97" }],
    material: "100% Combed Cotton",
    fitInfo: "Regular fit.",
    careInstructions: "Machine wash cold with like colours.",
    sizeGuideType: "apparel",
  },
  {
    name: "Graphic Logo Tee",
    categorySlug: "mens-tshirts",
    brand: "Solstice",
    gender: "MEN",
    price: 1999,
    description: "Soft-touch jersey tee featuring a subtle embroidered logo at the chest.",
    shortDescription: "Soft jersey tee with embroidered logo.",
    tags: ["casual", "bold"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Charcoal", hex: "#3a3a3a" }, { name: "Olive", hex: "#5c5f45" }],
    saleSizes: ["S", "M"],
    material: "100% Cotton Jersey",
    careInstructions: "Machine wash cold, inside out.",
    sizeGuideType: "apparel",
  },
  {
    name: "Straight-Leg Chino Trousers",
    categorySlug: "mens-trousers",
    brand: "Aurelia House",
    gender: "MEN",
    price: 5999,
    description: "Smart-casual chinos in a straight leg silhouette, finished with a soft brushed cotton twill.",
    shortDescription: "Brushed cotton twill chinos, straight leg.",
    tags: ["office", "classic"],
    sizes: ["30", "32", "34", "36"],
    colors: [{ name: "Khaki", hex: "#b6a179" }, { name: "Navy", hex: "#22314a" }],
    material: "98% Cotton, 2% Elastane",
    fitInfo: "Straight fit through the leg.",
    careInstructions: "Machine wash cold, do not tumble dry.",
    sizeGuideType: "apparel",
  },
  {
    name: "Relaxed Fit Cargo Trousers",
    categorySlug: "mens-trousers",
    brand: "Velure",
    gender: "MEN",
    price: 6999,
    description: "Utility-inspired cargo trousers with a relaxed fit and reinforced pockets.",
    shortDescription: "Relaxed-fit cargo trousers with utility pockets.",
    tags: ["casual", "bold"],
    sizes: ["30", "32", "34", "36"],
    colors: [{ name: "Black", hex: "#1c1b19" }, { name: "Stone", hex: "#b8ab97" }],
    material: "Cotton Ripstop",
    fitInfo: "Relaxed fit.",
    careInstructions: "Machine wash cold.",
    sizeGuideType: "apparel",
  },
  {
    name: "Slim Tapered Denim Jeans",
    categorySlug: "mens-jeans",
    brand: "Velure",
    gender: "MEN",
    price: 7499,
    description: "Premium stretch denim finished with a subtle wash and slim tapered leg.",
    shortDescription: "Stretch denim jeans, slim tapered leg.",
    tags: ["casual", "classic"],
    sizes: ["30", "32", "34", "36"],
    colors: [{ name: "Mid Wash", hex: "#5b7592" }, { name: "Dark Indigo", hex: "#2c3648" }],
    saleSizes: ["32", "34"],
    material: "98% Cotton, 2% Elastane",
    fitInfo: "Slim tapered fit.",
    careInstructions: "Wash inside out, cold water.",
    sizeGuideType: "apparel",
  },
  {
    name: "Classic Straight Denim Jeans",
    categorySlug: "mens-jeans",
    brand: "Solstice",
    gender: "MEN",
    price: 6999,
    description: "A timeless straight-leg jean in rigid selvedge denim that softens beautifully with wear.",
    shortDescription: "Rigid selvedge denim, straight leg.",
    tags: ["casual", "classic"],
    sizes: ["30", "32", "34", "36"],
    colors: [{ name: "Raw Indigo", hex: "#28374f" }],
    material: "100% Selvedge Denim",
    fitInfo: "Straight fit.",
    careInstructions: "Wash sparingly, cold water.",
    sizeGuideType: "apparel",
  },
  {
    name: "Embroidered Kandura",
    categorySlug: "mens-traditional",
    brand: "Casa Bloom",
    gender: "MEN",
    price: 12999,
    description: "A handcrafted kandura in fine cotton blend with subtle tone-on-tone embroidery detailing.",
    shortDescription: "Fine cotton blend kandura with embroidery.",
    tags: ["wedding", "classic", "evening"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Ivory", hex: "#efe9db" }],
    material: "Cotton Blend",
    fitInfo: "Regular fit, full length.",
    careInstructions: "Dry clean recommended.",
    sizeGuideType: "apparel",
    isFeatured: true,
    collections: ["wedding-edit"],
  },
  {
    name: "Leather Reversible Belt",
    categorySlug: "mens-accessories",
    brand: "Étoile",
    gender: "MEN",
    price: 3999,
    description: "A full-grain leather belt with a reversible buckle for effortless day-to-night styling.",
    shortDescription: "Full-grain reversible leather belt.",
    tags: ["office", "classic"],
    sizes: ["32", "34", "36", "38"],
    colors: [{ name: "Black/Brown", hex: "#3a2b22" }],
    material: "Full-Grain Leather",
    careInstructions: "Wipe clean with a soft cloth.",
  },
  // ---- Multi-attribute variant fixtures (Shoe Size×Width, Waist×Length, Pack Size, no-variant) ----
  {
    name: "Leather Derby Shoe",
    categorySlug: "mens-accessories",
    brand: "Étoile",
    gender: "MEN",
    price: 8999,
    description: "A hand-finished leather derby shoe with a durable rubber sole, built for everyday wear.",
    shortDescription: "Hand-finished leather derby shoe.",
    tags: ["office", "classic"],
    material: "Full-Grain Leather",
    careInstructions: "Wipe clean, use a shoe tree to retain shape.",
    variantAttributeDefs: [
      { name: "Shoe Size", values: [{ value: "8" }, { value: "9" }, { value: "10" }, { value: "11" }] },
      { name: "Width", values: [{ value: "Regular" }, { value: "Wide" }] },
    ],
    // Asymmetric on purpose: not every size comes in both widths, exercising the "S only comes
    // in Black/White" style case the admin UI's stale-row detection and disabled-combo PDP UX
    // are built for — Width here plays the role Colour plays in the apparel fixtures.
    customVariants: [
      { attributes: [{ name: "Shoe Size", value: "8" }, { name: "Width", value: "Regular" }], stock: 6 },
      { attributes: [{ name: "Shoe Size", value: "9" }, { name: "Width", value: "Regular" }], stock: 10 },
      { attributes: [{ name: "Shoe Size", value: "9" }, { name: "Width", value: "Wide" }], stock: 4 },
      { attributes: [{ name: "Shoe Size", value: "10" }, { name: "Width", value: "Regular" }], stock: 8 },
      { attributes: [{ name: "Shoe Size", value: "10" }, { name: "Width", value: "Wide" }], stock: 3 },
      { attributes: [{ name: "Shoe Size", value: "11" }, { name: "Width", value: "Wide" }], stock: 5 },
    ],
  },
  {
    name: "Relaxed Straight Jeans",
    categorySlug: "mens-jeans",
    brand: "Velure",
    gender: "MEN",
    price: 6499,
    description: "Relaxed straight-leg jeans in rigid cotton denim, available in a curated set of waist and length combinations.",
    shortDescription: "Relaxed straight-leg rigid denim jeans.",
    tags: ["casual", "classic"],
    material: "100% Cotton Denim",
    fitInfo: "Relaxed straight fit.",
    careInstructions: "Wash sparingly, cold water.",
    sizeGuideType: "apparel",
    variantAttributeDefs: [
      { name: "Waist", values: [{ value: "30" }, { value: "32" }, { value: "34" }] },
      { name: "Length/Inseam", values: [{ value: "30" }, { value: "32" }, { value: "34" }] },
      { name: "Colour", isColor: true, values: [{ value: "Black", hex: "#1c1b19" }, { value: "Blue", hex: "#2c3648" }] },
    ],
    // Non-cartesian: only the waist/length pairings that are actually stocked, each in one colour.
    customVariants: [
      { attributes: [{ name: "Waist", value: "30" }, { name: "Length/Inseam", value: "30" }, { name: "Colour", value: "Black", hex: "#1c1b19" }] },
      { attributes: [{ name: "Waist", value: "32" }, { name: "Length/Inseam", value: "30" }, { name: "Colour", value: "Black", hex: "#1c1b19" }] },
      { attributes: [{ name: "Waist", value: "32" }, { name: "Length/Inseam", value: "32" }, { name: "Colour", value: "Blue", hex: "#2c3648" }] },
      { attributes: [{ name: "Waist", value: "34" }, { name: "Length/Inseam", value: "32" }, { name: "Colour", value: "Blue", hex: "#2c3648" }] },
      { attributes: [{ name: "Waist", value: "34" }, { name: "Length/Inseam", value: "34" }, { name: "Colour", value: "Blue", hex: "#2c3648" }] },
    ],
  },
  {
    name: "Cotton Crew Socks (3-Pack)",
    categorySlug: "mens-accessories",
    brand: "Solstice",
    gender: "MEN",
    price: 1299,
    description: "Breathable combed cotton crew socks with reinforced heel and toe, sold in packs.",
    shortDescription: "Combed cotton crew socks, sold in packs.",
    tags: ["casual"],
    material: "80% Cotton, 15% Polyester, 5% Elastane",
    careInstructions: "Machine wash cold.",
    variantAttributeDefs: [{ name: "Pack Size", values: [{ value: "3 Pair" }, { value: "6 Pair" }] }],
    customVariants: [
      { attributes: [{ name: "Pack Size", value: "3 Pair" }], price: 1299, stock: 20 },
      { attributes: [{ name: "Pack Size", value: "6 Pair" }], price: 2299, stock: 12 },
    ],
  },
  {
    name: "Silk Pocket Square",
    categorySlug: "mens-accessories",
    brand: "Étoile",
    gender: "MEN",
    price: 1499,
    description: "A single-size silk pocket square, finished with hand-rolled edges — no variants needed.",
    shortDescription: "Hand-rolled silk pocket square.",
    tags: ["office", "wedding"],
    material: "100% Silk",
    careInstructions: "Dry clean only.",
    // No attributes at all — exercises the "no variants" single-default-variant case.
    customVariants: [{ attributes: [], stock: 15 }],
  },
  {
    name: "Merino Wool Crew Sweater",
    categorySlug: "mens-shirts",
    brand: "Aurelia House",
    gender: "MEN",
    price: 8499,
    description: "Lightweight merino wool sweater with a fine-gauge knit, perfect for layering.",
    shortDescription: "Fine-gauge merino wool crew sweater.",
    tags: ["office", "classic", "resort"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Charcoal", hex: "#3a3a3a" }, { name: "Camel", hex: "#c19a6b" }],
    material: "100% Merino Wool",
    careInstructions: "Hand wash cold or dry clean.",
    sizeGuideType: "apparel",
  },
  {
    name: "Linen Blend Resort Shirt",
    categorySlug: "mens-shirts",
    brand: "Casa Bloom",
    gender: "MEN",
    price: 4999,
    description: "Breathable linen-cotton blend shirt with a relaxed camp collar — resortwear at its finest.",
    shortDescription: "Linen-cotton camp collar resort shirt.",
    tags: ["resort", "casual"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Sand", hex: "#dcc9a3" }, { name: "White", hex: "#f5f3ee" }],
    material: "55% Linen, 45% Cotton",
    careInstructions: "Machine wash cold, line dry.",
    sizeGuideType: "apparel",
  },
  {
    name: "Quilted Bomber Jacket",
    categorySlug: "mens-accessories",
    brand: "Velure",
    gender: "MEN",
    price: 14999,
    description: "A refined bomber jacket with a quilted lining and ribbed cuffs for cool-weather layering.",
    shortDescription: "Quilted bomber jacket with ribbed cuffs.",
    tags: ["evening", "bold"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#1c1b19" }],
    saleSizes: ["M", "L"],
    material: "Nylon Shell, Polyester Fill",
    careInstructions: "Dry clean only.",
    sizeGuideType: "apparel",
  },

  // ---- WOMEN ----
  {
    name: "Silk Midi Wrap Dress",
    categorySlug: "womens-dresses",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 14999,
    description: "An elegant wrap dress in fluid silk, cut to fall gracefully to a flattering midi length.",
    shortDescription: "Fluid silk wrap dress, midi length.",
    tags: ["evening", "romantic", "wedding"],
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Emerald", hex: "#2f5344" }, { name: "Black", hex: "#1c1b19" }],
    material: "100% Mulberry Silk",
    fitInfo: "True to size, wrap tie waist.",
    careInstructions: "Dry clean only.",
    sizeGuideType: "apparel",
    isFeatured: true,
    collections: ["wedding-edit"],
  },
  {
    name: "Floral Chiffon Maxi Dress",
    categorySlug: "womens-dresses",
    brand: "Casa Bloom",
    gender: "WOMEN",
    price: 9999,
    description: "A romantic floral-print maxi dress in airy chiffon with a fitted waist and flowing skirt.",
    shortDescription: "Floral chiffon maxi dress, fitted waist.",
    tags: ["resort", "romantic"],
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Blush Floral", hex: "#e3c2c6" }],
    saleSizes: ["S", "M"],
    material: "100% Chiffon",
    careInstructions: "Hand wash cold.",
    sizeGuideType: "apparel",
  },
  {
    name: "Structured Blazer Dress",
    categorySlug: "womens-dresses",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 11499,
    description: "A sharply tailored blazer dress with statement shoulders and a cinched waist.",
    shortDescription: "Tailored blazer dress with cinched waist.",
    tags: ["office", "bold"],
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Black", hex: "#1c1b19" }, { name: "Ivory", hex: "#efe9db" }],
    material: "Polyester Blend Suiting",
    careInstructions: "Dry clean only.",
    sizeGuideType: "apparel",
  },
  {
    name: "Satin Cowl Neck Top",
    categorySlug: "womens-tops",
    brand: "Étoile",
    gender: "WOMEN",
    price: 4999,
    description: "A liquid satin top with a soft draped cowl neckline — effortlessly elevated.",
    shortDescription: "Draped cowl neck satin top.",
    tags: ["evening", "minimal"],
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Champagne", hex: "#e6d3b3" }, { name: "Black", hex: "#1c1b19" }],
    material: "100% Satin Polyester",
    careInstructions: "Hand wash cold.",
    sizeGuideType: "apparel",
  },
  {
    name: "Ribbed Knit Top",
    categorySlug: "womens-tops",
    brand: "Solstice",
    gender: "WOMEN",
    price: 2999,
    description: "A soft ribbed knit top with a flattering fitted silhouette, perfect for everyday layering.",
    shortDescription: "Fitted ribbed knit top.",
    tags: ["casual", "minimal"],
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "White", hex: "#f5f3ee" }, { name: "Sage", hex: "#9bab80" }, { name: "Black", hex: "#1c1b19" }],
    saleSizes: ["S"],
    material: "95% Viscose, 5% Elastane",
    careInstructions: "Machine wash cold.",
    sizeGuideType: "apparel",
  },
  {
    name: "Embellished Abaya",
    categorySlug: "womens-abayas",
    brand: "Casa Bloom",
    gender: "WOMEN",
    price: 16499,
    description: "An elegant open abaya in flowing nida fabric with hand-finished crystal embellishment along the sleeves.",
    shortDescription: "Nida abaya with crystal-embellished sleeves.",
    tags: ["wedding", "evening", "classic"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#1c1b19" }],
    material: "Nida Fabric",
    fitInfo: "Open front, regular fit.",
    careInstructions: "Dry clean only.",
    sizeGuideType: "apparel",
    isFeatured: true,
    collections: ["wedding-edit"],
  },
  {
    name: "Everyday Nida Abaya",
    categorySlug: "womens-abayas",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 8999,
    description: "A minimalist everyday abaya in soft-touch nida with a relaxed, flattering cut.",
    shortDescription: "Minimalist everyday nida abaya.",
    tags: ["casual", "minimal"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#1c1b19" }, { name: "Mocha", hex: "#6b5849" }],
    material: "Nida Fabric",
    careInstructions: "Dry clean recommended.",
    sizeGuideType: "apparel",
  },
  {
    name: "Embroidered Kaftan",
    categorySlug: "womens-traditional",
    brand: "Casa Bloom",
    gender: "WOMEN",
    price: 10999,
    description: "A statement kaftan in silk-blend fabric with intricate hand embroidery at the neckline.",
    shortDescription: "Silk-blend kaftan with hand embroidery.",
    tags: ["wedding", "evening", "romantic"],
    sizes: ["S", "M", "L"],
    colors: [{ name: "Teal", hex: "#2f6362" }, { name: "Rose", hex: "#c99590" }],
    material: "Silk Blend",
    careInstructions: "Dry clean only.",
    sizeGuideType: "apparel",
  },
  {
    name: "Pleated Traditional Skirt Set",
    categorySlug: "womens-traditional",
    brand: "Étoile",
    gender: "WOMEN",
    price: 8499,
    description: "A two-piece pleated skirt and top set finished with delicate embroidery detail.",
    shortDescription: "Two-piece pleated skirt set with embroidery.",
    tags: ["wedding", "romantic"],
    sizes: ["S", "M", "L"],
    colors: [{ name: "Gold", hex: "#c9a85c" }],
    saleSizes: ["M"],
    material: "Polyester Blend",
    careInstructions: "Dry clean only.",
    sizeGuideType: "apparel",
  },
  {
    name: "Silk Printed Scarf",
    categorySlug: "womens-accessories",
    brand: "Étoile",
    gender: "WOMEN",
    price: 3999,
    description: "A luxurious silk twill scarf finished with an exclusive artisan-inspired print.",
    shortDescription: "Silk twill scarf with artisan print.",
    tags: ["classic", "office"],
    colors: [{ name: "Multicolour", hex: "#c99590" }],
    material: "100% Silk Twill",
    careInstructions: "Dry clean only.",
  },
  {
    name: "Structured Top-Handle Bag",
    categorySlug: "womens-accessories",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 17499,
    description: "A structured top-handle bag in pebbled leather with gold-tone hardware.",
    shortDescription: "Pebbled leather top-handle bag.",
    tags: ["office", "classic"],
    colors: [{ name: "Cognac", hex: "#a15c32" }, { name: "Black", hex: "#1c1b19" }],
    material: "Pebbled Leather",
    careInstructions: "Store in dust bag when not in use.",
    isFeatured: true,
  },

  // ---- WOMEN: COSMETICS ----
  {
    name: "Velvet Matte Liquid Lipstick",
    categorySlug: "womens-cosmetics",
    brand: "Étoile",
    gender: "WOMEN",
    price: 1999,
    description: "A weightless liquid lipstick that sets to a soft matte finish and wears comfortably for hours without drying out the lips.",
    shortDescription: "Long-wearing matte liquid lipstick, weightless finish.",
    tags: ["makeup", "bold", "evening"],
    colors: [{ name: "Ruby Red", hex: "#8c2b2b" }, { name: "Nude Blush", hex: "#c98b7a" }, { name: "Terracotta", hex: "#b1573f" }],
    material: "Vegan, Cruelty-Free Formula",
    careInstructions: "Store upright in a cool, dry place away from direct sunlight.",
  },
  {
    name: "Second Skin Foundation",
    categorySlug: "womens-cosmetics",
    brand: "Casa Bloom",
    gender: "WOMEN",
    price: 3499,
    description: "A buildable, natural-finish foundation that evens out skin tone while letting texture show through for an effortless second-skin look.",
    shortDescription: "Buildable natural-finish foundation.",
    tags: ["makeup", "minimal"],
    colors: [{ name: "Ivory", hex: "#f1e1c6" }, { name: "Beige", hex: "#e0c19f" }, { name: "Honey", hex: "#c99567" }, { name: "Caramel", hex: "#9c6b42" }],
    saleSizes: ["One Size"],
    sizes: ["One Size"],
    material: "Hyaluronic Acid, SPF 20",
    careInstructions: "Store below 25°C, away from direct sunlight.",
  },
  {
    name: "Radiance Eyeshadow Palette",
    categorySlug: "womens-cosmetics",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 4499,
    description: "A twelve-shade eyeshadow palette blending richly pigmented mattes and shimmers for effortless day-to-night looks.",
    shortDescription: "12-shade matte and shimmer eyeshadow palette.",
    tags: ["makeup", "evening", "bold"],
    colors: [{ name: "Sunset Edit", hex: "#c9895c" }],
    material: "Talc-Free Formula",
    careInstructions: "Close compact fully after each use to prevent shade breakage.",
    isFeatured: true,
  },
  {
    name: "Hydrating Vitamin C Serum",
    categorySlug: "womens-cosmetics",
    brand: "Solstice",
    gender: "WOMEN",
    price: 4599,
    description: "A brightening facial serum with vitamin C and hyaluronic acid that visibly evens tone and boosts radiance with daily use.",
    shortDescription: "Brightening vitamin C and hyaluronic acid serum.",
    tags: ["skincare", "minimal"],
    sizes: ["30ml"],
    material: "Vitamin C, Hyaluronic Acid",
    careInstructions: "Store in a cool, dry place. Use within 6 months of opening.",
  },
  {
    name: "Volumizing Lash Mascara",
    categorySlug: "womens-cosmetics",
    brand: "Velure",
    gender: "WOMEN",
    price: 1599,
    description: "A buildable, clump-free mascara that lifts and volumizes lashes for a dramatic, all-day finish.",
    shortDescription: "Buildable volumizing mascara, clump-free formula.",
    tags: ["makeup", "casual"],
    colors: [{ name: "Blackest Black", hex: "#141414" }],
    material: "Fibre-Infused Formula",
    careInstructions: "Replace every 3 months after opening.",
  },

  // ---- KIDS ----
  {
    name: "Boys Print Polo Shirt",
    categorySlug: "kids-boys",
    brand: "Solstice",
    gender: "KIDS",
    price: 1799,
    description: "A soft cotton polo shirt with a playful print, perfect for everyday adventures.",
    shortDescription: "Cotton polo shirt with playful print.",
    tags: ["casual"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "Blue", hex: "#5b7592" }, { name: "Red", hex: "#a3372f" }],
    material: "100% Cotton",
    careInstructions: "Machine wash warm.",
    sizeGuideType: "kids",
  },
  {
    name: "Boys Cargo Shorts",
    categorySlug: "kids-boys",
    brand: "Velure",
    gender: "KIDS",
    price: 1599,
    description: "Durable cotton cargo shorts built for play, with reinforced knees and roomy pockets.",
    shortDescription: "Durable cotton cargo shorts.",
    tags: ["casual"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "Khaki", hex: "#b6a179" }],
    saleSizes: ["4-5Y"],
    material: "100% Cotton",
    careInstructions: "Machine wash warm.",
    sizeGuideType: "kids",
  },
  {
    name: "Boys Formal Shirt Set",
    categorySlug: "kids-boys",
    brand: "Aurelia House",
    gender: "KIDS",
    price: 3299,
    description: "A smart shirt and trouser set for special occasions, tailored just for little gentlemen.",
    shortDescription: "Occasion shirt and trouser set.",
    tags: ["wedding", "classic"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "White", hex: "#f5f3ee" }],
    material: "Cotton Blend",
    careInstructions: "Machine wash cold.",
    sizeGuideType: "kids",
  },
  {
    name: "Boys Graphic Hoodie",
    categorySlug: "kids-boys",
    brand: "Solstice",
    gender: "KIDS",
    price: 2499,
    description: "A cosy fleece hoodie with a fun graphic print, perfect for cooler days.",
    shortDescription: "Fleece hoodie with graphic print.",
    tags: ["casual"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "Grey", hex: "#9a978f" }, { name: "Navy", hex: "#22314a" }],
    material: "Cotton Fleece",
    careInstructions: "Machine wash cold.",
    sizeGuideType: "kids",
  },
  {
    name: "Girls Tulle Party Dress",
    categorySlug: "kids-girls",
    brand: "Casa Bloom",
    gender: "KIDS",
    price: 4599,
    description: "A twirl-worthy tulle dress with a satin bodice, made for birthdays and celebrations.",
    shortDescription: "Tulle party dress with satin bodice.",
    tags: ["wedding", "romantic"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "Blush", hex: "#e3c2c6" }, { name: "Ivory", hex: "#efe9db" }],
    saleSizes: ["4-5Y"],
    material: "Tulle & Satin",
    careInstructions: "Dry clean recommended.",
    sizeGuideType: "kids",
    isFeatured: true,
  },
  {
    name: "Girls Floral Sundress",
    categorySlug: "kids-girls",
    brand: "Casa Bloom",
    gender: "KIDS",
    price: 2299,
    description: "A breezy cotton sundress in a cheerful floral print for warm days out.",
    shortDescription: "Cotton floral sundress.",
    tags: ["resort", "casual"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "Yellow Floral", hex: "#e2c97a" }],
    material: "100% Cotton",
    careInstructions: "Machine wash cold.",
    sizeGuideType: "kids",
  },
  {
    name: "Girls Knit Cardigan Set",
    categorySlug: "kids-girls",
    brand: "Aurelia House",
    gender: "KIDS",
    price: 2999,
    description: "A soft knit cardigan and dress set, perfect for layering through the seasons.",
    shortDescription: "Knit cardigan and dress two-piece set.",
    tags: ["casual", "classic"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "Pink", hex: "#d59aa4" }, { name: "Cream", hex: "#efe9db" }],
    material: "Cotton Knit",
    careInstructions: "Hand wash cold.",
    sizeGuideType: "kids",
  },
  {
    name: "Girls Traditional Embroidered Dress",
    categorySlug: "kids-girls",
    brand: "Casa Bloom",
    gender: "KIDS",
    price: 4599,
    description: "A festive embroidered dress designed for celebrations, mirroring our women's traditional edit.",
    shortDescription: "Embroidered festive dress for celebrations.",
    tags: ["wedding", "classic"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: [{ name: "Teal", hex: "#2f6362" }],
    material: "Silk Blend",
    careInstructions: "Dry clean only.",
    sizeGuideType: "kids",
  },

  // ---- PERFUMES ----
  {
    name: "Oud Royale Eau de Parfum",
    categorySlug: "perfumes-men",
    brand: "Maison Noir",
    gender: "MEN",
    price: 11999,
    description: "A rich, smoky oud fragrance layered with amber and warm spice — bold and unforgettable.",
    shortDescription: "Smoky oud fragrance with amber and spice.",
    tags: ["evening", "bold"],
    sizes: ["50ml", "100ml"],
    fragranceFamily: "Woody Oriental",
    fragranceNotes: { top: ["Saffron", "Bergamot"], heart: ["Oud", "Rose"], base: ["Amber", "Sandalwood"] },
    concentration: "Eau de Parfum",
    isFeatured: true,
  },
  {
    name: "Citrus Vetiver Cologne",
    categorySlug: "perfumes-men",
    brand: "Solstice",
    gender: "MEN",
    price: 6999,
    description: "A crisp, energising blend of citrus and vetiver for everyday wear.",
    shortDescription: "Crisp citrus and vetiver everyday cologne.",
    tags: ["office", "casual"],
    sizes: ["50ml", "100ml"],
    saleSizes: ["100ml"],
    fragranceFamily: "Citrus Aromatic",
    fragranceNotes: { top: ["Bergamot", "Grapefruit"], heart: ["Vetiver", "Geranium"], base: ["Musk", "Cedar"] },
    concentration: "Eau de Toilette",
  },
  {
    name: "Leather & Tobacco EDP",
    categorySlug: "perfumes-men",
    brand: "Velure",
    gender: "MEN",
    price: 9499,
    description: "A confident, masculine scent built around rich leather and warm tobacco leaf.",
    shortDescription: "Masculine scent with leather and tobacco.",
    tags: ["evening", "bold"],
    sizes: ["50ml", "100ml"],
    fragranceFamily: "Leather",
    fragranceNotes: { top: ["Cardamom"], heart: ["Leather", "Tobacco"], base: ["Vanilla", "Amber"] },
    concentration: "Eau de Parfum",
  },
  {
    name: "Rose Blush Eau de Parfum",
    categorySlug: "perfumes-women",
    brand: "Casa Bloom",
    gender: "WOMEN",
    price: 9999,
    description: "A romantic bouquet of Damask rose and peony, softened with warm musk.",
    shortDescription: "Romantic rose and peony fragrance.",
    tags: ["romantic", "evening"],
    sizes: ["50ml", "100ml"],
    fragranceFamily: "Floral",
    fragranceNotes: { top: ["Peony", "Pink Pepper"], heart: ["Damask Rose", "Jasmine"], base: ["Musk", "Vanilla"] },
    concentration: "Eau de Parfum",
    isFeatured: true,
  },
  {
    name: "Jasmine Amber Perfume",
    categorySlug: "perfumes-women",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 8499,
    description: "An intoxicating blend of night-blooming jasmine and golden amber.",
    shortDescription: "Jasmine and amber evening fragrance.",
    tags: ["evening", "romantic"],
    sizes: ["50ml", "100ml"],
    saleSizes: ["50ml"],
    fragranceFamily: "Floral Oriental",
    fragranceNotes: { top: ["Mandarin"], heart: ["Jasmine", "Ylang-Ylang"], base: ["Amber", "Vanilla"] },
    concentration: "Eau de Parfum",
  },
  {
    name: "Vanilla Orchid Mist",
    categorySlug: "perfumes-women",
    brand: "Étoile",
    gender: "WOMEN",
    price: 6499,
    description: "A soft, powdery vanilla fragrance with a delicate orchid heart — perfect for everyday elegance.",
    shortDescription: "Soft vanilla and orchid everyday fragrance.",
    tags: ["casual", "office"],
    sizes: ["50ml", "100ml"],
    fragranceFamily: "Floral Gourmand",
    fragranceNotes: { top: ["Pear"], heart: ["Orchid", "Iris"], base: ["Vanilla", "Musk"] },
    concentration: "Eau de Toilette",
  },
  {
    name: "White Musk Unisex Fragrance",
    categorySlug: "perfumes-unisex",
    brand: "Solstice",
    gender: "UNISEX",
    price: 5999,
    description: "A clean, understated white musk fragrance designed to be worn by everyone.",
    shortDescription: "Clean white musk fragrance for everyone.",
    tags: ["casual", "minimal"],
    sizes: ["50ml", "100ml"],
    fragranceFamily: "Musk",
    fragranceNotes: { top: ["Bergamot"], heart: ["White Musk", "Iris"], base: ["Sandalwood"] },
    concentration: "Eau de Parfum",
  },
  {
    name: "Amber Woods Unisex EDP",
    categorySlug: "perfumes-unisex",
    brand: "Velure",
    gender: "UNISEX",
    price: 7699,
    description: "A warm, resinous amber and woods composition that transitions effortlessly from day to night.",
    shortDescription: "Warm amber and woods unisex fragrance.",
    tags: ["evening", "classic"],
    sizes: ["50ml", "100ml"],
    fragranceFamily: "Woody",
    fragranceNotes: { top: ["Cardamom"], heart: ["Cedarwood"], base: ["Amber", "Oud"] },
    concentration: "Eau de Parfum",
  },

  // ---- JEWELLERY ----
  {
    name: "Layered Gold Chain Necklace",
    categorySlug: "jewellery-necklaces",
    brand: "Étoile",
    gender: "WOMEN",
    price: 5999,
    description: "A delicate layered chain necklace finished in 18k gold plating for everyday sparkle.",
    shortDescription: "18k gold-plated layered chain necklace.",
    tags: ["classic", "office"],
    colors: [{ name: "Gold", hex: "#c9a85c" }],
    material: "18k Gold Plated Brass",
    careInstructions: "Avoid contact with water and perfume.",
    isFeatured: true,
  },
  {
    name: "Pearl Pendant Necklace",
    categorySlug: "jewellery-necklaces",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 6699,
    description: "A timeless freshwater pearl pendant on a fine gold-tone chain.",
    shortDescription: "Freshwater pearl pendant necklace.",
    tags: ["classic", "wedding"],
    colors: [{ name: "Gold/Pearl", hex: "#e6d3b3" }],
    saleSizes: ["One Size"],
    sizes: ["One Size"],
    material: "Freshwater Pearl, Gold Plated Brass",
    careInstructions: "Store separately in a soft pouch.",
  },
  {
    name: "Statement Cocktail Ring",
    categorySlug: "jewellery-rings",
    brand: "Étoile",
    gender: "WOMEN",
    price: 4999,
    description: "A bold statement ring set with a faceted stone in a vintage-inspired setting.",
    shortDescription: "Bold faceted stone cocktail ring.",
    tags: ["evening", "bold"],
    sizes: ["6", "7", "8"],
    colors: [{ name: "Gold/Emerald", hex: "#2f5344" }],
    material: "Gold Plated Brass, Glass Stone",
    careInstructions: "Remove before washing hands.",
  },
  {
    name: "Minimalist Stacking Ring Set",
    categorySlug: "jewellery-rings",
    brand: "Solstice",
    gender: "WOMEN",
    price: 3499,
    description: "A set of three slim stacking rings designed to be worn together or alone.",
    shortDescription: "Set of three slim stacking rings.",
    tags: ["minimal", "casual"],
    sizes: ["6", "7", "8"],
    colors: [{ name: "Gold", hex: "#c9a85c" }, { name: "Silver", hex: "#c7c7c7" }],
    material: "Gold/Rhodium Plated Brass",
    careInstructions: "Avoid contact with water.",
  },
  {
    name: "Chunky Chain Bracelet",
    categorySlug: "jewellery-bracelets",
    brand: "Velure",
    gender: "WOMEN",
    price: 4399,
    description: "A bold chunky chain bracelet that makes a statement on its own.",
    shortDescription: "Bold chunky gold-tone chain bracelet.",
    tags: ["bold", "evening"],
    colors: [{ name: "Gold", hex: "#c9a85c" }],
    material: "Gold Plated Brass",
    careInstructions: "Avoid contact with water and perfume.",
  },
  {
    name: "Delicate Beaded Bracelet Set",
    categorySlug: "jewellery-bracelets",
    brand: "Casa Bloom",
    gender: "WOMEN",
    price: 2699,
    description: "A set of three delicate beaded bracelets in soft, wearable tones.",
    shortDescription: "Set of three delicate beaded bracelets.",
    tags: ["minimal", "casual", "resort"],
    saleSizes: ["One Size"],
    sizes: ["One Size"],
    colors: [{ name: "Multi", hex: "#c99590" }],
    material: "Glass Beads, Elastic Cord",
    careInstructions: "Avoid excessive stretching.",
  },
  {
    name: "Crystal Drop Earrings",
    categorySlug: "jewellery-earrings",
    brand: "Maison Noir",
    gender: "WOMEN",
    price: 5499,
    description: "Elegant crystal drop earrings that catch the light beautifully for evening occasions.",
    shortDescription: "Crystal drop earrings for evening wear.",
    tags: ["evening", "wedding", "romantic"],
    colors: [{ name: "Silver/Crystal", hex: "#c7c7c7" }],
    material: "Rhodium Plated Brass, Crystal",
    careInstructions: "Store in a soft pouch.",
    isFeatured: true,
    collections: ["wedding-edit"],
  },
  {
    name: "Gold Hoop Earrings",
    categorySlug: "jewellery-earrings",
    brand: "Étoile",
    gender: "WOMEN",
    price: 3899,
    description: "Classic medium-sized gold hoops that work from morning meetings to evening dinners.",
    shortDescription: "Classic medium gold hoop earrings.",
    tags: ["classic", "office", "casual"],
    colors: [{ name: "Gold", hex: "#c9a85c" }],
    material: "18k Gold Plated Brass",
    careInstructions: "Avoid contact with water and perfume.",
  },
];

const CATEGORY_TREE: { name: string; slug: string; gender: Gender | null; children: { name: string; slug: string }[] }[] = [
  {
    name: "Men",
    slug: "men",
    gender: "MEN",
    children: [
      { name: "Shirts", slug: "mens-shirts" },
      { name: "T-Shirts", slug: "mens-tshirts" },
      { name: "Trousers", slug: "mens-trousers" },
      { name: "Jeans", slug: "mens-jeans" },
      { name: "Traditional Wear", slug: "mens-traditional" },
      { name: "Accessories", slug: "mens-accessories" },
    ],
  },
  {
    name: "Women",
    slug: "women",
    gender: "WOMEN",
    children: [
      { name: "Dresses", slug: "womens-dresses" },
      { name: "Tops", slug: "womens-tops" },
      { name: "Abayas", slug: "womens-abayas" },
      { name: "Traditional Wear", slug: "womens-traditional" },
      { name: "Cosmetics", slug: "womens-cosmetics" },
      { name: "Accessories", slug: "womens-accessories" },
    ],
  },
  {
    name: "Kids",
    slug: "kids",
    gender: "KIDS",
    children: [
      { name: "Boys", slug: "kids-boys" },
      { name: "Girls", slug: "kids-girls" },
    ],
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    gender: null,
    children: [
      { name: "Men", slug: "perfumes-men" },
      { name: "Women", slug: "perfumes-women" },
      { name: "Unisex", slug: "perfumes-unisex" },
    ],
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    gender: null,
    children: [
      { name: "Necklaces", slug: "jewellery-necklaces" },
      { name: "Rings", slug: "jewellery-rings" },
      { name: "Bracelets", slug: "jewellery-bracelets" },
      { name: "Earrings", slug: "jewellery-earrings" },
    ],
  },
];

async function main() {
  console.log("Clearing existing data...");
  await db.$transaction([
    db.review.deleteMany(),
    db.wishlistItem.deleteMany(),
    db.cartItem.deleteMany(),
    db.cart.deleteMany(),
    db.orderStatusHistory.deleteMany(),
    db.refund.deleteMany(),
    db.invoice.deleteMany(),
    db.payment.deleteMany(),
    db.shipment.deleteMany(),
    db.return.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.address.deleteMany(),
    db.journalEntry.deleteMany(),
    db.purchaseOrder.deleteMany(),
    db.expense.deleteMany(),
    db.supplier.deleteMany(),
    db.productVariant.deleteMany(),
    db.warehouse.deleteMany(),
    db.productImage.deleteMany(),
    db.product.deleteMany(),
    db.collection.deleteMany(),
    db.category.deleteMany(),
    db.brand.deleteMany(),
    db.banner.deleteMany(),
    db.promotion.deleteMany(),
    db.coupon.deleteMany(),
    db.homepageSection.deleteMany(),
    db.setting.deleteMany(),
    db.newsletterSubscriber.deleteMany(),
    db.searchLog.deleteMany(),
  ]);

  console.log("Creating categories...");
  const categoryIdBySlug = new Map<string, string>();
  for (const [i, top] of CATEGORY_TREE.entries()) {
    const created = await db.category.create({
      data: {
        name: top.name,
        slug: top.slug,
        gender: top.gender ?? undefined,
        sortOrder: i,
        imageUrl: CATEGORY_IMAGES[top.slug] ?? art(top.slug, "category", top.name),
        children: {
          create: top.children.map((c, j) => ({
            name: c.name,
            slug: c.slug,
            sortOrder: j,
            imageUrl: CATEGORY_IMAGES[c.slug] ?? art(c.slug, "category", c.name),
          })),
        },
      },
      include: { children: true },
    });
    categoryIdBySlug.set(top.slug, created.id);
    created.children.forEach((c) => categoryIdBySlug.set(c.slug, c.id));
  }

  console.log("Creating brands...");
  const brandIdByName = new Map<string, string>();
  for (const name of BRANDS) {
    const brand = await db.brand.create({ data: { name, slug: slugify(name), logoUrl: art(name, "square", name, undefined, "png") } });
    brandIdByName.set(name, brand.id);
  }

  console.log("Creating collections...");
  const collections = [
    { name: "Wedding Edit", slug: "wedding-edit", description: "Statement pieces for your most memorable occasions." },
    { name: "Summer Collection", slug: "summer-collection", description: "Lightweight fabrics and breezy silhouettes for warm days." },
    { name: "New Season", slug: "new-season", description: "Fresh arrivals across every category." },
    { name: "Perfume Edit", slug: "perfume-edit", description: "Signature scents to complete every look." },
  ];
  for (const [i, c] of collections.entries()) {
    await db.collection.create({ data: { ...c, sortOrder: i, imageUrl: COLLECTION_IMAGES[c.slug] ?? art(c.slug, "collection", c.name) } });
  }

  console.log("Creating products...");
  for (const spec of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(spec.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${spec.categorySlug}`);
    const slug = slugify(spec.name);
    const sku = `SKU-${slug.toUpperCase().slice(0, 10)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const variants = buildVariants(spec, slug);
    const attributeDefs = buildAttributeDefs(spec);

    await db.product.create({
      data: {
        name: spec.name,
        slug,
        sku,
        categoryId,
        brandId: brandIdByName.get(spec.brand),
        description: spec.description,
        shortDescription: spec.shortDescription,
        basePrice: spec.price,
        gender: spec.gender,
        tags: spec.tags,
        material: spec.material,
        fitInfo: spec.fitInfo,
        careInstructions: spec.careInstructions,
        sizeGuideType: spec.sizeGuideType,
        fragranceFamily: spec.fragranceFamily,
        fragranceNotes: spec.fragranceNotes ?? undefined,
        concentration: spec.concentration,
        isFeatured: spec.isFeatured ?? false,
        collections: spec.collections ? { connect: spec.collections.map((s) => ({ slug: s })) } : undefined,
        images: {
          create: [0, 1].map((i) => ({
            url: art(`${slug}-${i}`, "product", spec.name, spec.categorySlug.split("-")[0]),
            altText: spec.name,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        },
        variants: {
          create: variants.map((v, i) => ({
            sku: `${sku}-${i}`,
            attributeValues: v.attributes as unknown as Prisma.InputJsonValue,
            ...deriveMirrorFields(v.attributes),
            price: v.price,
            salePrice: v.salePrice,
            stock: v.stock,
            isDefault: i === 0,
          })),
        },
        variantAttributes: {
          create: attributeDefs.map((d, i) => ({
            name: d.name,
            isColor: d.isColor ?? false,
            position: i,
            values: d.values as unknown as Prisma.InputJsonValue,
          })),
        },
      },
    });
  }

  console.log("Creating default warehouse and backfilling stock...");
  const mainWarehouse = await db.warehouse.create({
    data: { name: "Main Warehouse", code: "MAIN", isActive: true, isDefault: true },
  });
  const allVariants = await db.productVariant.findMany({ select: { id: true, stock: true } });
  await db.variantWarehouseStock.createMany({
    data: allVariants.map((v) => ({ variantId: v.id, warehouseId: mainWarehouse.id, quantity: v.stock })),
  });

  console.log("Adding sample reviews...");
  const sampleProducts = await db.product.findMany({ take: 20, orderBy: { createdAt: "asc" } });
  const reviewTexts = [
    { rating: 5, title: "Exceeded expectations", comment: "The quality is incredible and it fits perfectly. Will be ordering more colours." },
    { rating: 4, title: "Great value", comment: "Really happy with this purchase, arrived quickly and looks just like the photos." },
    { rating: 5, title: "My new favourite", comment: "Comfortable, stylish, and true to size. Highly recommend to anyone on the fence." },
    { rating: 3, title: "Good but runs small", comment: "Nice quality overall but I'd size up if you're in between sizes." },
  ];
  for (const product of sampleProducts) {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const r = reviewTexts[(i + product.name.length) % reviewTexts.length];
      await db.review.create({
        data: {
          productId: product.id,
          customerName: ["Sara A.", "Mohammed K.", "Layla H.", "James P.", "Fatima R."][i % 5],
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isVerifiedPurchase: i % 2 === 0,
        },
      });
    }
    const agg = await db.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: true });
    await db.product.update({ where: { id: product.id }, data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count } });
  }

  console.log("Creating banners, promotions & coupons...");
  const now = new Date();
  const heroSlides: { title: string; subtitle: string; ctaText: string; ctaLink: string }[] = [
    { title: "Discover The Latest Collection", subtitle: "New Season", ctaText: "Shop Now", ctaLink: "/collections/new-season" },
    { title: "Modern Styles For Every Occasion", subtitle: "Men's Collection", ctaText: "Shop Men", ctaLink: "/men" },
    { title: "Fashion for Every Moment", subtitle: "Women's Collection", ctaText: "Shop Women", ctaLink: "/women" },
    { title: "The Fragrance Edit", subtitle: "Perfume Collection", ctaText: "Discover Scents", ctaLink: "/perfumes" },
    { title: "Everyday Styles For Little Ones", subtitle: "Kids Collection", ctaText: "Shop Kids", ctaLink: "/kids" },
    { title: "Up To 30% Off", subtitle: "Sale", ctaText: "Shop Now", ctaLink: "/sale" },
  ];
  for (const [i, slide] of heroSlides.entries()) {
    await db.banner.create({
      data: {
        title: slide.title,
        subtitle: slide.subtitle,
        imageUrl: HERO_IMAGES[i] ?? art(`hero-${i}`, "hero"),
        ctaText: slide.ctaText,
        ctaLink: slide.ctaLink,
        position: "HERO" as BannerPosition,
        sortOrder: i,
      },
    });
  }

  await db.banner.create({
    data: {
      title: "Up To 40% Off",
      subtitle: "Selected Styles",
      imageUrl: banner("promo-sale.jpg"),
      ctaText: "Shop the Sale",
      ctaLink: "/sale",
      position: "PROMO" as BannerPosition,
      sortOrder: 0,
    },
  });

  await db.promotion.create({
    data: {
      name: "24-Hour Flash Sale",
      type: "FLASH_SALE" as PromotionType,
      discountType: "PERCENTAGE" as DiscountType,
      discountValue: 30,
      categorySlugs: ["men", "women", "kids", "perfumes", "jewellery"],
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
      isActive: true,
      bannerText: "Limited Time Offer",
    },
  });

  await db.coupon.create({
    data: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "PERCENTAGE",
      discountValue: 10,
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365),
      isActive: true,
    },
  });
  await db.coupon.create({
    data: {
      code: "SAVE100",
      description: "₹100 off orders over ₹999",
      discountType: "FIXED",
      discountValue: 100,
      minOrderValue: 999,
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365),
      isActive: true,
    },
  });

  console.log("Creating homepage sections...");
  const sections = [
    "hero",
    "categoryShowcase",
    "newArrivals",
    "promoBanner",
    "featuredCollections",
    "bestSellers",
    "adBanner",
    "trustFeatures",
    "newsletter",
  ];
  for (const [i, key] of sections.entries()) {
    await db.homepageSection.create({ data: { key, sortOrder: i, isVisible: true } });
  }

  // A key absent from HomepageSection entirely falls back to visible=true
  // (see resolveHomepageSections in src/lib/home-sections.ts) — so every
  // legacy/optional section not in the curated list above must get an
  // explicit hidden row, or a fresh install would render all of them again.
  // Not deleted from the code/catalog — an admin can still re-enable any of
  // these from /admin/homepage.
  const hiddenSections = [
    "shopByCategoryRail",
    "genderTriptych",
    "imageRunningBanner",
    "trending",
    "mensFeature",
    "womensFeature",
    "kidsFeature",
    "perfumeFeature",
    "jewelleryFeature",
    "runningBanner",
    "adBanner2",
    "brandStripTop",
    "brandStripBottom",
    "recommendedProducts",
    "styleFinder",
    "flashSale",
    // Its default images (/images/banners/social-*.jpg) aren't real files —
    // keep it hidden until an admin uploads real photos.
    "socialGallery",
  ];
  for (const [i, key] of hiddenSections.entries()) {
    await db.homepageSection.create({ data: { key, sortOrder: sections.length + i, isVisible: false } });
  }

  console.log("Seeding chart of accounts...");
  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    await db.ledgerAccount.upsert({
      where: { code: account.code },
      create: { code: account.code, name: account.name, type: account.type, isContra: account.isContra ?? false },
      update: { name: account.name, type: account.type, isContra: account.isContra ?? false },
    });
  }

  console.log("Creating settings...");
  await db.setting.create({ data: { key: "brandName", value: "MIZOON ZARF", group: "brand" } });
  await db.setting.create({ data: { key: "whatsappNumber", value: "919501234567", group: "general" } });
  await db.setting.create({ data: { key: "supportEmail", value: "info@mizoonzarf.in", group: "general" } });

  console.log("Creating notification templates...");
  const notificationTemplates: { key: string; channel: "EMAIL" | "SMS"; subject?: string; body: string; variables: string[] }[] = [
    { key: "order_placed", channel: "EMAIL", subject: "We've received your order {{order_number}}", body: "Hi {{customer_name}}, thanks for your order {{order_number}} — total {{order_total}}. We'll let you know as soon as it ships.", variables: ["customer_name", "order_number", "order_total"] },
    { key: "order_placed", channel: "SMS", body: "Order {{order_number}} received - total {{order_total}}. Thanks for shopping with us!", variables: ["order_number", "order_total"] },
    { key: "payment_confirmed", channel: "EMAIL", subject: "Payment confirmed for order {{order_number}}", body: "Your payment for order {{order_number}} ({{order_total}}) has been confirmed. We're preparing your order now.", variables: ["order_number", "order_total"] },
    { key: "payment_confirmed", channel: "SMS", body: "Payment confirmed for order {{order_number}} ({{order_total}}).", variables: ["order_number", "order_total"] },
    { key: "order_shipped", channel: "EMAIL", subject: "Your order {{order_number}} has shipped", body: "Good news — order {{order_number}} is on its way.", variables: ["order_number"] },
    { key: "order_shipped", channel: "SMS", body: "Order {{order_number}} has shipped and is on its way.", variables: ["order_number"] },
    { key: "order_out_for_delivery", channel: "EMAIL", subject: "Order {{order_number}} is out for delivery", body: "Your order {{order_number}} is out for delivery today.", variables: ["order_number"] },
    { key: "order_out_for_delivery", channel: "SMS", body: "Order {{order_number}} is out for delivery today.", variables: ["order_number"] },
    { key: "order_delivered", channel: "EMAIL", subject: "Order {{order_number}} delivered", body: "Order {{order_number}} has been delivered. Enjoy!", variables: ["order_number"] },
    { key: "order_delivered", channel: "SMS", body: "Order {{order_number}} has been delivered. Enjoy!", variables: ["order_number"] },
    { key: "order_cancelled", channel: "EMAIL", subject: "Order {{order_number}} cancelled", body: "Your order {{order_number}} has been cancelled.", variables: ["order_number"] },
    { key: "order_cancelled", channel: "SMS", body: "Order {{order_number}} has been cancelled.", variables: ["order_number"] },
    { key: "order_refunded", channel: "EMAIL", subject: "Order {{order_number}} refunded", body: "Your payment for order {{order_number}} ({{order_total}}) has been refunded.", variables: ["order_number", "order_total"] },
    { key: "order_refunded", channel: "SMS", body: "Order {{order_number}} has been refunded.", variables: ["order_number"] },
    { key: "contact_form_submission", channel: "EMAIL", subject: "New contact form message from {{customer_name}}", body: "From: {{customer_name}} ({{customer_email}})\n\n{{message}}", variables: ["customer_name", "customer_email", "message"] },
  ];
  for (const t of notificationTemplates) {
    await db.notificationTemplate.upsert({
      where: { key_channel: { key: t.key, channel: t.channel } },
      update: {},
      create: t,
    });
  }

  console.log("Creating admin user...");
  const adminEmail = "admin@mizoonzarf.in";
  const adminPassword = "Admin@12345";
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Store Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "SUPER_ADMIN",
    },
  });

  console.log("Creating Customer Care manager...");
  const careManagerEmail = "care@mizoonzarf.in";
  const careManagerPassword = "Care@12345";
  await db.user.upsert({
    where: { email: careManagerEmail },
    update: {},
    create: {
      name: "Customer Care Manager",
      email: careManagerEmail,
      passwordHash: await bcrypt.hash(careManagerPassword, 10),
      role: "CUSTOMER_SUPPORT_MANAGER",
    },
  });

  console.log("Creating system staff roles...");
  await seedSystemStaffRoles(db);

  console.log("Creating ticket reply templates...");
  const ticketReplyTemplates: { name: string; category: string | null; body: string }[] = [
    { name: "Order Confirmation", category: "ORDER_ISSUE", body: "Hi {{customer_name}}, thanks for reaching out — your order {{order_number}} is confirmed and being processed. We'll update you as soon as it ships." },
    { name: "Order Delayed", category: "DELAYED_DELIVERY", body: "Hi {{customer_name}}, we're sorry for the delay on order {{order_number}}. We're following up with our courier partner and will share an updated delivery estimate shortly." },
    { name: "Order Shipped", category: "DELIVERY_ISSUE", body: "Hi {{customer_name}}, good news — order {{order_number}} has shipped and is on its way to you." },
    { name: "Cancellation Confirmation", category: "ORDER_CANCELLATION", body: "Hi {{customer_name}}, your order {{order_number}} has been cancelled as requested. Any payment made will be refunded to your original payment method." },
    { name: "Return Approved", category: "RETURN_REQUEST", body: "Hi {{customer_name}}, your return request for order {{order_number}} has been approved. Please keep the item ready for pickup — we'll be in touch with the schedule." },
    { name: "Return Rejected", category: "RETURN_REQUEST", body: "Hi {{customer_name}}, after review, we're unable to approve the return for order {{order_number}}. Please reply to this ticket if you'd like more details." },
    { name: "Refund Initiated", category: "REFUND_ISSUE", body: "Hi {{customer_name}}, your refund for order {{order_number}} has been initiated and should reflect in your original payment method within 5-7 business days." },
    { name: "Refund Completed", category: "REFUND_ISSUE", body: "Hi {{customer_name}}, your refund for order {{order_number}} has been completed. Please let us know if you don't see it reflected within a few days." },
    { name: "Delivery Issue", category: "DELIVERY_ISSUE", body: "Hi {{customer_name}}, we're sorry to hear about the delivery issue with order {{order_number}}. We're looking into this with our courier partner and will update you shortly." },
    { name: "General Response", category: null, body: "Hi {{customer_name}}, thanks for reaching out. We're looking into this and will get back to you shortly." },
  ];
  for (const t of ticketReplyTemplates) {
    const existing = await db.ticketReplyTemplate.findFirst({ where: { name: t.name } });
    if (!existing) await db.ticketReplyTemplate.create({ data: t as never });
  }

  console.log("Seed complete.");
  console.log("");
  console.log("Admin login  ->  /login");
  console.log(`  email:    ${adminEmail}`);
  console.log(`  password: ${adminPassword}`);
  console.log("");
  console.log("Customer Care manager login  ->  /login");
  console.log(`  email:    ${careManagerEmail}`);
  console.log(`  password: ${careManagerPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
