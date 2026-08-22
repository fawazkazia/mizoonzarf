import { ProductForm } from "../ProductForm";
import { getProductFormOptions } from "../form-options";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const { categories, brands, collections } = await getProductFormOptions();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Add Product</h1>
      <ProductForm categories={categories} brands={brands} collections={collections} />
    </div>
  );
}
