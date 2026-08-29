import { getMenuCategories } from "@/lib/data/categories";
import { getNewArrivals, getTrending, getBestSellers, getFeaturedProducts } from "@/lib/data/products";
import {
  getHeroSlides,
  getPromoBanner,
  getActiveFlashSale,
  getFeaturedCollections,
  getFeaturedBrands,
  getHomepageSections,
  getVerticalFeature,
} from "@/lib/data/home";
import { resolveHomepageSections, visibleSectionKeys, sectionConfig } from "@/lib/home-sections";
import { getSettings } from "@/lib/settings";
import { buildHeaderPromoMessages } from "@/lib/currency";
import { resolveSectionConfig, type HomepageSectionConfigKey } from "@/lib/validation/homepage-section-config";
import { homepageThemeStyle } from "@/lib/homepage-theme-style";
import { Hero } from "@/components/home/Hero";
import { GenderTriptych } from "@/components/home/GenderTriptych";
import { ShopByCategoryRail } from "@/components/home/ShopByCategoryRail";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanner } from "@/components/home/PromoBanner";
import { VerticalFeature } from "@/components/home/VerticalFeature";
import { FlashSaleCountdown } from "@/components/home/FlashSaleCountdown";
import { StyleFinder } from "@/components/home/StyleFinder";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { SocialGallery } from "@/components/home/SocialGallery";
import { NewsletterSection } from "@/components/home/Newsletter";
import { BrandStrip } from "@/components/home/BrandStrip";
import { AdBanner } from "@/components/home/AdBanner";
import { RunningBanner } from "@/components/home/RunningBanner";
import { ImageRunningBanner } from "@/components/home/ImageRunningBanner";

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
    mensFeature,
    womensFeature,
    kidsFeature,
    recommendedProducts,
    featuredBrands,
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
    getVerticalFeature("men"),
    getVerticalFeature("women"),
    getVerticalFeature("kids"),
    getFeaturedProducts(8),
    getFeaturedBrands(5),
  ]);

  const resolvedSections = resolveHomepageSections(sectionRows);
  const order = resolvedSections.map((s) => s.key);
  const visibleKeys = new Set(visibleSectionKeys(sectionRows));
  const isVisible = (key: string) => visibleKeys.has(key);

  /** Reads a section's admin-edited config, validated against its schema with a
   * safe fallback to today's defaults — see src/lib/validation/homepage-section-config.ts. */
  function cfg<K extends HomepageSectionConfigKey>(key: K) {
    return resolveSectionConfig(key, sectionConfig(resolvedSections, key));
  }

  const genderCategories = menuCategories
    .filter((c) => c.gender !== null)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      imageObjectPosition: c.imageObjectPosition,
      children: c.children.map((child) => ({ name: child.name, slug: child.slug })),
    }));

  const categoryRailItems = menuCategories.flatMap((c) =>
    c.children.map((child) => ({
      name: child.name,
      href: `/${c.slug}?category=${child.slug}`,
      imageUrl: child.imageUrl,
      imageObjectPosition: child.imageObjectPosition,
      seed: child.slug,
    }))
  );

  const renderers: Record<string, React.ReactNode> = {
    shopByCategoryRail: (
      <ShopByCategoryRail
        items={categoryRailItems}
        heading={cfg("shopByCategoryRail").heading}
        accentGradient={{
          from: settings.promoStrips.brandsBanner.gradientFrom,
          via: settings.promoStrips.brandsBanner.gradientVia,
          to: settings.promoStrips.brandsBanner.gradientTo,
        }}
      />
    ),
    hero: (
      <Hero
        slides={heroSlides.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: s.subtitle,
          titleColor: s.titleColor,
          subtitleColor: s.subtitleColor,
          titleSize: s.titleSize,
          contentPositionX: s.contentPositionX,
          contentPositionY: s.contentPositionY,
          imageUrl: s.imageUrl,
          mobileImageUrl: s.mobileImageUrl,
          imageObjectPosition: s.imageObjectPosition,
          ctaText: s.ctaText,
          ctaLink: s.ctaLink,
        }))}
      />
    ),
    genderTriptych: <GenderTriptych categories={genderCategories} />,
    imageRunningBanner: (
      <ImageRunningBanner images={newArrivals.map((p) => ({ id: p.id, src: p.image, alt: p.name }))} />
    ),
    newArrivals: <ProductRail {...cfg("newArrivals")} products={newArrivals} viewAllHref="/men?sort=newest" compactTop compactBottom />,
    trending: <ProductRail {...cfg("trending")} products={trending} viewAllHref="/women" surface="paper-dim" />,
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
        titleColor={promoBanner.titleColor}
        subtitleColor={promoBanner.subtitleColor}
        titleSize={promoBanner.titleSize}
        contentPositionX={promoBanner.contentPositionX}
        contentPositionY={promoBanner.contentPositionY}
        imageUrl={promoBanner.imageUrl}
        mobileImageUrl={promoBanner.mobileImageUrl}
        imageObjectPosition={promoBanner.imageObjectPosition}
        ctaText={promoBanner.ctaText}
        ctaLink={promoBanner.ctaLink}
      />
    ),
    styleFinder: <StyleFinder {...cfg("styleFinder")} />,
    adBanner: <AdBanner {...cfg("adBanner")} />,
    adBanner2: <AdBanner {...cfg("adBanner2")} />,
    bestSellers: <ProductRail {...cfg("bestSellers")} products={bestSellers} viewAllHref="/men?sort=best_selling" />,
    perfumeFeature: perfumeFeature && (
      <VerticalFeature category={perfumeFeature.category} products={perfumeFeature.products} {...cfg("perfumeFeature")} accent="gold" spacing="top" />
    ),
    jewelleryFeature: jewelleryFeature && (
      <VerticalFeature category={jewelleryFeature.category} products={jewelleryFeature.products} {...cfg("jewelleryFeature")} accent="gold" spacing="bottom" />
    ),
    mensFeature: mensFeature && (
      <VerticalFeature category={mensFeature.category} products={mensFeature.products} {...cfg("mensFeature")} accent="ink" />
    ),
    womensFeature: womensFeature && (
      <VerticalFeature category={womensFeature.category} products={womensFeature.products} {...cfg("womensFeature")} accent="gold" spacing="top" />
    ),
    runningBanner: <RunningBanner messages={buildHeaderPromoMessages(settings)} />,
    kidsFeature: kidsFeature && (
      <VerticalFeature category={kidsFeature.category} products={kidsFeature.products} {...cfg("kidsFeature")} accent="ink" />
    ),
    recommendedProducts: <ProductRail {...cfg("recommendedProducts")} products={recommendedProducts} surface="paper-dim" />,
    featuredCollections: (
      <FeaturedCollections
        collections={collections.map((c) => ({
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
          imageObjectPosition: c.imageObjectPosition,
          endDate: c.endDate?.toISOString() ?? null,
        }))}
        {...cfg("featuredCollections")}
      />
    ),
    socialGallery: <SocialGallery handle={`@${settings.brandName.toLowerCase().replace(/\s+/g, "")}`} {...cfg("socialGallery")} />,
    newsletter: <NewsletterSection {...cfg("newsletter")} />,
    brandStripTop: <BrandStrip brands={featuredBrands} />,
    brandStripBottom: <BrandStrip brands={featuredBrands} />,
  };

  return (
    <div style={homepageThemeStyle(settings.homepageTheme)}>
      {order.map((key) => (isVisible(key) ? <div key={key}>{renderers[key]}</div> : null))}
    </div>
  );
}
