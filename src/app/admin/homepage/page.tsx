import { db } from "@/lib/db";
import { resolveHomepageSections } from "@/lib/home-sections";
import { HomepageSectionsForm } from "./HomepageSectionsForm";

export const metadata = { title: "Homepage" };

export default async function HomepagePage() {
  const rows = await db.homepageSection.findMany();
  const sections = resolveHomepageSections(rows);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Homepage</h1>
      <p className="max-w-2xl text-sm text-ink-soft">
        Control which sections appear on the homepage and the order they appear in. Use the arrows to reorder, the
        eye icon to show/hide a section, and the title field to override a section&apos;s default heading.
      </p>
      <HomepageSectionsForm initial={sections} />
    </div>
  );
}
