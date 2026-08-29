import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";
import { objectPositionClass, type ObjectPositionValue } from "@/lib/object-position";

export interface TriptychCategory {
  name: string;
  slug: string;
  imageUrl: string | null;
  imageObjectPosition?: ObjectPositionValue | null;
  children: { name: string; slug: string }[];
}

/** "Shop Men | Women | Kids" editorial band. Reuses the already-fetched
 * getMenuCategories() data filtered to gendered top-level categories — no
 * new query. Child quick-links use a stretched-link pattern (an absolute
 * full-tile <Link> beneath a pointer-events-none content layer whose own
 * links sit on top) so the tile is one big tap target without nesting
 * anchors. */
export function GenderTriptych({ categories }: { categories: TriptychCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="border-y border-line bg-ink">
      <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-line/20">
        {categories.map((cat) => (
          <div key={cat.slug} className="img-zoom group relative h-56 overflow-hidden sm:h-64 lg:h-72">
            <Img src={cat.imageUrl} alt={cat.name} seedFallback={cat.slug} className={objectPositionClass(cat.imageObjectPosition, "object-top")} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
            <Link href={`/${cat.slug}`} className="absolute inset-0" aria-label={`Shop ${cat.name}`} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-paper">
              {cat.children.length > 0 && (
                <div className="pointer-events-auto absolute inset-x-4 bottom-full mb-2 hidden flex-col gap-1 lg:flex lg:opacity-0 lg:transition-opacity lg:duration-[var(--dur-2)] lg:group-hover:opacity-100">
                  {cat.children.slice(0, 4).map((child) => (
                    <Link
                      key={child.slug}
                      href={`/${cat.slug}?category=${child.slug}`}
                      className="link-reveal w-fit text-[11px] uppercase tracking-[0.1em] text-paper/85"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
              <Link href={`/${cat.slug}`} className="pointer-events-auto font-display text-xl hover:underline">
                {cat.name}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
