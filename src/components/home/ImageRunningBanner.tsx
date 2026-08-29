import { Img } from "@/components/ui/ArtImage";

export interface RunningImage {
  id: string;
  src: string;
  alt: string;
}

/** Slim continuously-scrolling strip of image thumbnails — same marquee
 * mechanic as RunningBanner, swapping text messages for images. The list is
 * rendered twice back to back and animated by exactly -50% so the loop
 * seams invisibly. */
export function ImageRunningBanner({ images }: { images: RunningImage[] }) {
  if (images.length === 0) return null;

  const loop = [...images, ...images];

  return (
    <section className="overflow-hidden bg-ink py-2">
      <div className="flex w-max animate-marquee items-center gap-2 motion-reduce:animate-none sm:gap-2.5">
        {loop.map((img, i) => (
          <span key={`${img.id}-${i}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-md sm:h-16 sm:w-16">
            <Img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
          </span>
        ))}
      </div>
    </section>
  );
}
