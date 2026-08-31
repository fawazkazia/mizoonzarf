import { SupplierForm } from "../SupplierForm";

export const metadata = { title: "Add Supplier" };

export default function NewSupplierPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Add Supplier</h1>
      <SupplierForm />
    </div>
  );
}
