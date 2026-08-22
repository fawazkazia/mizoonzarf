import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Gender, type BannerPosition, type PromotionType, type DiscountType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function art(seed: string, kind: string, label?: string, caption?: string) {
  const params = new URLSearchParams({ seed, kind });
  if (label) params.set("label", label);
  if (caption) params.set("caption", caption);
  return `/api/art?${params.toString()}`;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const BRANDS = ["Aurelia House", "Maison Noir", "Velure", "Solstice", "Casa Bloom", "Étoile"];

interface VariantSpec {
  size?: string;
  color?: string;
  colorHex?: string;
  price: number;
  salePrice?: number;
  stock: number;
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
  const sizes = spec.sizes?.length ? spec.sizes : [undefined];
  const colors = spec.colors?.length ? spec.colors : [undefined];
  const variants: VariantSpec[] = [];

  for (const size of sizes) {
    for (const color of colors) {
      const onSale = spec.saleSizes?.includes(size ?? "");
      variants.push({
        size,
        color: color?.name,
        colorHex: color?.hex,
        price: spec.price,
        salePrice: onSale ? Math.round(spec.price * 0.7 * 100) / 100 : undefined,
        stock: 5 + Math.floor((skuBase.length * 7) % 20),
      });
    }
  }
  return variants;
}

const PRODUCTS: ProductSpec[] = [
  // ---- MEN ----
  {
    name: "Tailored Slim-Fit Shirt",
    categorySlug: "mens-shirts",
    brand: "Aurelia House",
    gender: "MEN",
    price: 249,
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
    price: 89,
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
    price: 99,
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
    price: 279,
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
    price: 319,
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
    price: 329,
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
    price: 299,
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
    price: 459,
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
    price: 189,
    description: "A full-grain leather belt with a reversible buckle for effortless day-to-night styling.",
    shortDescription: "Full-grain reversible leather belt.",
    tags: ["office", "classic"],
    sizes: ["32", "34", "36", "38"],
    colors: [{ name: "Black/Brown", hex: "#3a2b22" }],
    material: "Full-Grain Leather",
    careInstructions: "Wipe clean with a soft cloth.",
  },
  {
    name: "Merino Wool Crew Sweater",
    categorySlug: "mens-shirts",
    brand: "Aurelia House",
    gender: "MEN",
    price: 349,
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
    price: 219,
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
    price: 549,
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
    price: 549,
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
    price: 429,
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
    price: 479,
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
    price: 219,
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
    price: 149,
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
    price: 589,
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
    price: 399,
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
    price: 469,
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
    price: 389,
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
    price: 199,
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
    price: 649,
    description: "A structured top-handle bag in pebbled leather with gold-tone hardware.",
    shortDescription: "Pebbled leather top-handle bag.",
    tags: ["office", "classic"],
    colors: [{ name: "Cognac", hex: "#a15c32" }, { name: "Black", hex: "#1c1b19" }],
    material: "Pebbled Leather",
    careInstructions: "Store in dust bag when not in use.",
    isFeatured: true,
  },

  // ---- KIDS ----
  {
    name: "Boys Print Polo Shirt",
    categorySlug: "kids-boys",
    brand: "Solstice",
    gender: "KIDS",
    price: 89,
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
    price: 79,
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
    price: 159,
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
    price: 119,
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
    price: 189,
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
    price: 109,
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
    price: 139,
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
    price: 199,
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
    price: 429,
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
    price: 289,
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
    price: 379,
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
    price: 399,
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
    price: 349,
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
    price: 269,
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
    price: 259,
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
    price: 319,
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
    price: 249,
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
    price: 289,
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
    price: 219,
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
    price: 159,
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
    price: 199,
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
    price: 129,
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
    price: 229,
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
    price: 169,
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
    db.payment.deleteMany(),
    db.shipment.deleteMany(),
    db.return.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.address.deleteMany(),
    db.productVariant.deleteMany(),
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
        imageUrl: art(top.slug, "category", top.name),
        children: {
          create: top.children.map((c, j) => ({
            name: c.name,
            slug: c.slug,
            sortOrder: j,
            imageUrl: art(c.slug, "category", c.name),
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
    const brand = await db.brand.create({ data: { name, slug: slugify(name), logoUrl: art(name, "square", name) } });
    brandIdByName.set(name, brand.id);
  }

  console.log("Creating collections...");
  const collections = [
    { name: "Wedding Edit", slug: "wedding-edit", description: "Statement pieces for your most memorable occasions." },
    { name: "Summer Collection", slug: "summer-collection", description: "Lightweight fabrics and breezy silhouettes for warm days." },
    { name: "New Season", slug: "new-season", description: "Fresh arrivals across every category." },
  ];
  for (const [i, c] of collections.entries()) {
    await db.collection.create({ data: { ...c, sortOrder: i, imageUrl: art(c.slug, "collection", c.name) } });
  }

  console.log("Creating products...");
  for (const spec of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(spec.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${spec.categorySlug}`);
    const slug = slugify(spec.name);
    const sku = `SKU-${slug.toUpperCase().slice(0, 10)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const variants = buildVariants(spec, slug);

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
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
            salePrice: v.salePrice,
            stock: v.stock,
            isDefault: i === 0,
          })),
        },
      },
    });
  }

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
    { title: "Define Your Style", subtitle: "New Season", ctaText: "Shop Men", ctaLink: "/men" },
    { title: "Fashion for Every Moment", subtitle: "The Edit", ctaText: "Shop Women", ctaLink: "/women" },
    { title: "The Fragrance Edit", subtitle: "Perfumes", ctaText: "Discover Scents", ctaLink: "/perfumes" },
  ];
  for (const [i, slide] of heroSlides.entries()) {
    await db.banner.create({
      data: {
        title: slide.title,
        subtitle: slide.subtitle,
        imageUrl: art(`hero-${i}`, "hero"),
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
      imageUrl: art("promo-sale", "banner"),
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
      code: "SAVE50",
      description: "AED 50 off orders over AED 300",
      discountType: "FIXED",
      discountValue: 50,
      minOrderValue: 300,
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365),
      isActive: true,
    },
  });

  console.log("Creating homepage sections...");
  const sections = [
    "hero",
    "categoryGrid",
    "newArrivals",
    "flashSale",
    "promoBanner",
    "trending",
    "styleFinder",
    "bestSellers",
    "featuredCollections",
    "socialGallery",
    "newsletter",
  ];
  for (const [i, key] of sections.entries()) {
    await db.homepageSection.create({ data: { key, sortOrder: i, isVisible: true } });
  }

  console.log("Creating settings...");
  await db.setting.create({ data: { key: "brandName", value: "Maison Luxe", group: "brand" } });
  await db.setting.create({ data: { key: "whatsappNumber", value: "971501234567", group: "general" } });
  await db.setting.create({ data: { key: "supportEmail", value: "care@maisonluxe.ae", group: "general" } });

  console.log("Creating admin user...");
  const adminEmail = "admin@maisonluxe.ae";
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

  console.log("Seed complete.");
  console.log("");
  console.log("Admin login  ->  /login");
  console.log(`  email:    ${adminEmail}`);
  console.log(`  password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
