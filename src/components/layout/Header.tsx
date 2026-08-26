import { getMenuCategories, getCategoryBanner, getCategoryBrands, getTopBrands } from "@/lib/data/categories";
import { getPromoBanner } from "@/lib/data/home";
import { auth } from "@/lib/auth";
import { buildNavItems } from "@/lib/nav";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const [categories, session, saleBanner, promoBanner, topBrands] = await Promise.all([
    getMenuCategories(),
    auth(),
    getCategoryBanner("sale"),
    getPromoBanner(),
    getTopBrands(),
  ]);

  const banners = await Promise.all(
    categories.map(async (c) => ({ slug: c.slug, banner: await getCategoryBanner(c.slug) }))
  );
  const bannerBySlug = new Map(banners.map((b) => [b.slug, b.banner]));

  const brandLists = await Promise.all(
    categories.map(async (c) => ({
      slug: c.slug,
      brands: await getCategoryBrands(c.id, c.children.map((child) => child.id)),
    }))
  );
  const brandsBySlug = new Map(brandLists.map((b) => [b.slug, b.brands]));

  const menu = buildNavItems(
    categories,
    (slug) => {
      const banner = bannerBySlug.get(slug);
      if (!banner) return null;
      return { imageUrl: banner.imageUrl, title: banner.title, subtitle: banner.subtitle, ctaLink: banner.ctaLink };
    },
    // Sale's mega-menu feature image: a Banner(CATEGORY) targeting /sale
    // specifically, falling back to the generic homepage promo banner.
    saleBanner
      ? { imageUrl: saleBanner.imageUrl, title: saleBanner.title, subtitle: saleBanner.subtitle, ctaLink: saleBanner.ctaLink }
      : promoBanner
        ? { imageUrl: promoBanner.imageUrl, title: promoBanner.title, subtitle: promoBanner.subtitle, ctaLink: promoBanner.ctaLink }
        : null,
    (slug) => brandsBySlug.get(slug) ?? [],
    topBrands
  );

  return <HeaderClient menu={menu} isSignedIn={Boolean(session?.user)} />;
}
