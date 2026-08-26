import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { cn } from "@/lib/utils";

const SOCIAL_IMAGES = [
  "/images/banners/social-0.jpg",
  "/images/banners/social-1.jpg",
  "/images/banners/social-2.jpg",
  "/images/banners/social-3.jpg",
  "/images/banners/social-4.jpg",
  "/images/banners/social-5.jpg",
];

export function SocialGallery({ handle }: { handle: string }) {
  const tiles = SOCIAL_IMAGES.map((src, i) => ({ src, seed: `social-${i}` }));

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <InstagramIcon size={20} className="text-ink-soft" />
          <h2 className="font-display text-2xl sm:text-3xl">Style For Every Generation</h2>
          <p className="text-sm text-ink-soft">Follow {handle} for daily style inspiration.</p>
        </div>
        {/* Dummy gallery pending a real Instagram feed integration. */}
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {tiles.map(({ src, seed }, i) => (
            <div
              key={seed}
              className={cn("img-zoom group relative aspect-square overflow-hidden bg-paper-dim", (i === 0 || i === 5) && "sm:col-span-2")}
            >
              <Img src={src} alt="Style inspiration" seedFallback={seed} />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-[var(--dur-1)] group-hover:bg-ink/40">
                <InstagramIcon size={22} className="text-paper opacity-0 transition-opacity duration-[var(--dur-1)] group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
