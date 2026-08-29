import Link from "next/link";
import { db } from "@/lib/db";
import { resolveHomepageSections } from "@/lib/home-sections";
import { HomepageSectionsForm } from "./HomepageSectionsForm";

export const metadata = { title: "Homepage" };

export default async function HomepagePage() {
  const rows = await db.homepageSection.findMany();
  const sections = resolveHomepageSections(rows);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Homepage</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Control which sections appear on the homepage, the order they appear in, and each section&apos;s content.
            Use the arrows to reorder, the eye icon to show/hide a section, the title field to override a section&apos;s
            default heading, and &quot;Edit content&quot; for text/image fields specific to that section.
          </p>
        </div>
        <Link
          href="/admin/homepage/theme"
          className="shrink-0 border border-line px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-ink hover:border-ink"
        >
          Homepage Theme
        </Link>
      </div>
      <HomepageSectionsForm initial={sections} />
    </div>
  );
}
