import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SupplierForm } from "../../SupplierForm";

export const metadata = { title: "Edit Supplier" };

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await db.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Edit Supplier</h1>
      <SupplierForm
        initial={{
          id: supplier.id,
          name: supplier.name,
          code: supplier.code,
          contactName: supplier.contactName ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          gstin: supplier.gstin ?? "",
          isActive: supplier.isActive,
        }}
      />
    </div>
  );
}
