import { Fragment } from "react";
import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CategoryRowActions } from "./CategoryRowActions";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Categories</h1>
        <ButtonLink href="/admin/categories/new">+ Add Category</ButtonLink>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Products</Th>
            <Th>Menu</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && <EmptyRow colSpan={5}>No categories yet.</EmptyRow>}
          {categories.map((top) => (
            <Fragment key={top.id}>
              <tr>
                <Td className="font-medium">{top.name}</Td>
                <Td>{top._count.products}</Td>
                <Td>{top.showInMenu ? "Yes" : "No"}</Td>
                <Td>
                  <Badge tone={top.isActive ? "success" : "outline"}>{top.isActive ? "Active" : "Inactive"}</Badge>
                </Td>
                <Td className="text-right">
                  <CategoryRowActions id={top.id} name={top.name} />
                </Td>
              </tr>
              {top.children.map((child) => (
                <tr key={child.id}>
                  <Td className="pl-8 text-ink-soft">— {child.name}</Td>
                  <Td>{child._count.products}</Td>
                  <Td>{child.showInMenu ? "Yes" : "No"}</Td>
                  <Td>
                    <Badge tone={child.isActive ? "success" : "outline"}>{child.isActive ? "Active" : "Inactive"}</Badge>
                  </Td>
                  <Td className="text-right">
                    <CategoryRowActions id={child.id} name={child.name} />
                  </Td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
