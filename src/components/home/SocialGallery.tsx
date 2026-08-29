import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { objectPositionClass, type ObjectPositionValue } from "@/lib/object-position";
import { cn } from "@/lib/utils";

const DEFAULT_IMAGES = [
  "/images/banners/social-0.jpg",
  "/images/banners/social-1.jpg",
  "/images/banners/social-2.jpg",
  "/images/banners/social-3.jpg",
  "/images/banners/social-4.jpg",
  "/images/banners/social-5.jpg",
].map((url) => ({ url, alt: "Style inspiration", link: null as string | null, objectPosition: null as ObjectPositionValue | null }));

export interface SocialGalleryImage {
  url: string;
  alt: string;
  link?: string | null;
  objectPosition?: ObjectPositionValue | null;
}

export function SocialGallery({
  handle,
  heading = "Style For Every Generation",
  subtitle,
  images = DEFAULT_IMAGES,
}: {
  handle: string;
  heading?: string;
  subtitle?: string;
  images?: SocialGalleryImage[];
}) {
  const tiles = images.map((img, i) => ({ ...img, seed: `social-${i}` }));

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <InstagramIcon size={20} className="text-ink-soft" />
          <h2 className="hp-heading font-display text-2xl sm:text-3xl">{heading}</h2>
          <p className="hp-body text-sm text-ink-soft">{subtitle ?? `Follow ${handle} for daily style inspiration.`}</p>
        </div>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {tiles.map(({ url, alt, link, objectPosition, seed }, i) => {
            const tileClassName = cn(
              "img-zoom group relative aspect-square overflow-hidden bg-paper-dim",
              i === 0 || i === 5 ? "sm:col-span-2" : "sm:aspect-auto"
            );
            const content = (
              <>
                <Img src={url} alt={alt} seedFallback={seed} className={objectPositionClass(objectPosition)} />
                <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-[var(--dur-1)] group-hover:bg-ink/40">
                  <InstagramIcon size={22} className="text-paper opacity-0 transition-opacity duration-[var(--dur-1)] group-hover:opacity-100" />
                </div>
              </>
            );
            return link ? (
              <Link key={seed} href={link} className={tileClassName}>
                {content}
              </Link>
            ) : (
              <div key={seed} className={tileClassName}>
                {content}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
