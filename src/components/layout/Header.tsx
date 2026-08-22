import { getMenuCategories, getCategoryBanner } from "@/lib/data/categories";
import { auth } from "@/lib/auth";
import { buildNavItems } from "@/lib/nav";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const [categories, session] = await Promise.all([getMenuCategories(), auth()]);

  const banners = await Promise.all(
    categories.map(async (c) => ({ slug: c.slug, banner: await getCategoryBanner(c.slug) }))
  );
  const bannerBySlug = new Map(banners.map((b) => [b.slug, b.banner]));

  const menu = buildNavItems(categories, (slug) => {
    const banner = bannerBySlug.get(slug);
    if (!banner) return null;
    return { imageUrl: banner.imageUrl, title: banner.title, subtitle: banner.subtitle, ctaLink: banner.ctaLink };
  });

  return <HeaderClient menu={menu} isSignedIn={Boolean(session?.user)} />;
}
