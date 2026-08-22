import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Img } from "@/components/ui/ArtImage";
import { BannerRowActions } from "./BannerRowActions";

export const metadata = { title: "Banners" };

const POSITION_LABEL: Record<string, string> = {
  HERO: "Hero",
  PROMO: "Promo",
  CATEGORY: "Category",
  POPUP: "Popup",
};

export default async function BannersPage() {
  const banners = await db.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Banners</h1>
        <ButtonLink href="/admin/banners/new">+ Add Banner</ButtonLink>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Image</Th>
            <Th>Title</Th>
            <Th>Position</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {banners.length === 0 && <EmptyRow colSpan={5}>No banners yet.</EmptyRow>}
          {banners.map((b) => (
            <tr key={b.id}>
              <Td>
                <div className="h-12 w-20 overflow-hidden border border-line bg-paper-dim">
                  <Img src={b.imageUrl} alt={b.title} />
                </div>
              </Td>
              <Td className="font-medium">{b.title}</Td>
              <Td>{POSITION_LABEL[b.position] ?? b.position}</Td>
              <Td>
                <Badge tone={b.isActive ? "success" : "outline"}>{b.isActive ? "Active" : "Inactive"}</Badge>
              </Td>
              <Td className="text-right">
                <BannerRowActions id={b.id} title={b.title} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
