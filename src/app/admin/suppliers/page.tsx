import { db } from "@/lib/db";
import { Table, Th, Td, EmptyRow } from "@/components/admin/Table";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/currency";
import { SupplierRowActions } from "./SupplierRowActions";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { invoices: { where: { type: "PURCHASE" }, select: { total: true, amountPaid: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Suppliers</h1>
        <ButtonLink href="/admin/suppliers/new">+ Add Supplier</ButtonLink>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Code</Th>
            <Th>Contact</Th>
            <Th>Outstanding (money we owe)</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length === 0 && <EmptyRow colSpan={6}>No suppliers yet.</EmptyRow>}
          {suppliers.map((supplier) => {
            const outstanding = supplier.invoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)), 0);
            return (
              <tr key={supplier.id}>
                <Td className="font-medium">{supplier.name}</Td>
                <Td>{supplier.code}</Td>
                <Td>{supplier.contactName || supplier.email || supplier.phone || "—"}</Td>
                <Td>{outstanding > 0 ? formatINR(outstanding) : "—"}</Td>
                <Td>
                  <Badge tone={supplier.isActive ? "success" : "outline"}>{supplier.isActive ? "Active" : "Inactive"}</Badge>
                </Td>
                <Td className="text-right">
                  <SupplierRowActions id={supplier.id} name={supplier.name} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
