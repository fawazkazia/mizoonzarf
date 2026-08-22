import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CollectionRowActions } from "./CollectionRowActions";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Collections</h1>
        <ButtonLink href="/admin/collections/new">+ Add Collection</ButtonLink>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Products</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {collections.length === 0 && <EmptyRow colSpan={4}>No collections yet.</EmptyRow>}
          {collections.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.name}</Td>
              <Td>{c._count.products}</Td>
              <Td>
                <Badge tone={c.isActive ? "success" : "outline"}>{c.isActive ? "Active" : "Inactive"}</Badge>
              </Td>
              <Td className="text-right">
                <CollectionRowActions id={c.id} name={c.name} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
