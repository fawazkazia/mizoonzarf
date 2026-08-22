import { getMenuCategories } from "@/lib/data/categories";
import { getNewArrivals, getTrending, getBestSellers } from "@/lib/data/products";
import {
  getHeroSlides,
  getPromoBanner,
  getActiveFlashSale,
  getFeaturedCollections,
  getHomepageSections,
  getVerticalFeature,
} from "@/lib/data/home";
import { resolveHomepageSections, visibleSectionKeys } from "@/lib/home-sections";
import { getSettings } from "@/lib/settings";
import { Hero } from "@/components/home/Hero";
import { GenderTriptych } from "@/components/home/GenderTriptych";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanner } from "@/components/home/PromoBanner";
import { VerticalFeature } from "@/components/home/VerticalFeature";
import { FlashSaleCountdown } from "@/components/home/FlashSaleCountdown";
import { StyleFinder } from "@/components/home/StyleFinder";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { SocialGallery } from "@/components/home/SocialGallery";
import { NewsletterSection } from "@/components/home/Newsletter";

export default async function HomePage() {
  const [
    sectionRows,
    menuCategories,
    settings,
    heroSlides,
    promoBanner,
    flashSale,
    collections,
    newArrivals,
    trending,
    bestSellers,
    perfumeFeature,
    jewelleryFeature,
  ] = await Promise.all([
    getHomepageSections(),
    getMenuCategories(),
    getSettings(),
    getHeroSlides(),
    getPromoBanner(),
    getActiveFlashSale(),
    getFeaturedCollections(),
    getNewArrivals(8),
    getTrending(8),
    getBestSellers(8),
    getVerticalFeature("perfumes"),
    getVerticalFeature("jewellery"),
  ]);

  const resolvedSections = resolveHomepageSections(sectionRows);
  const order = resolvedSections.map((s) => s.key);
  const visibleKeys = new Set(visibleSectionKeys(sectionRows));
  const isVisible = (key: string) => visibleKeys.has(key);

  const genderCategories = menuCategories
    .filter((c) => c.gender !== null)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      children: c.children.map((child) => ({ name: child.name, slug: child.slug })),
    }));

  const renderers: Record<string, React.ReactNode> = {
    hero: (
      <Hero
        slides={heroSlides.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: s.subtitle,
          imageUrl: s.imageUrl,
          mobileImageUrl: s.mobileImageUrl,
          ctaText: s.ctaText,
          ctaLink: s.ctaLink,
        }))}
      />
    ),
    genderTriptych: <GenderTriptych categories={genderCategories} />,
    categoryGrid: (
      <CategoryGrid
        categories={menuCategories.map((c) => ({ name: c.name, slug: c.slug, imageUrl: c.imageUrl, childCount: c.children.length }))}
      />
    ),
    newArrivals: <ProductRail title="New Arrivals" subtitle="The latest additions to the edit" eyebrow="Just In" products={newArrivals} viewAllHref="/men?sort=newest" />,
    trending: <ProductRail title="Trending Now" subtitle="What everyone is loving right now" eyebrow="Trending" products={trending} viewAllHref="/women" surface="paper-dim" />,
    flashSale: flashSale && (
      <FlashSaleCountdown
        name={flashSale.promo.name}
        endDate={flashSale.promo.endDate.toISOString()}
        discountLabel={flashSale.promo.bannerText ?? "Limited Time Offer"}
        discountType={flashSale.promo.discountType}
        discountValue={Number(flashSale.promo.discountValue)}
        products={flashSale.products}
      />
    ),
    promoBanner: promoBanner && (
      <PromoBanner
        title={promoBanner.title}
        subtitle={promoBanner.subtitle}
        imageUrl={promoBanner.imageUrl}
        mobileImageUrl={promoBanner.mobileImageUrl}
        ctaText={promoBanner.ctaText}
        ctaLink={promoBanner.ctaLink}
      />
    ),
    styleFinder: <StyleFinder />,
    bestSellers: <ProductRail title="Best Sellers" subtitle="Our most-loved pieces" eyebrow="Best Sellers" products={bestSellers} viewAllHref="/men?sort=best_selling" />,
    perfumeFeature: perfumeFeature && <VerticalFeature category={perfumeFeature.category} products={perfumeFeature.products} eyebrow="The Edit" accent="gold" />,
    jewelleryFeature: jewelleryFeature && <VerticalFeature category={jewelleryFeature.category} products={jewelleryFeature.products} eyebrow="The Edit" accent="gold" />,
    featuredCollections: (
      <FeaturedCollections
        collections={collections.map((c) => ({
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
          endDate: c.endDate?.toISOString() ?? null,
        }))}
      />
    ),
    socialGallery: <SocialGallery handle={`@${settings.brandName.toLowerCase().replace(/\s+/g, "")}`} />,
    newsletter: <NewsletterSection />,
  };

  return <>{order.map((key) => (isVisible(key) ? <div key={key}>{renderers[key]}</div> : null))}</>;
}
