import { getProductFormOptions } from "../form-options";
import { ImportWorkspace } from "./ImportWorkspace";

export const metadata = { title: "Import Products" };

export default async function ImportProductsPage() {
  const { categories, brands } = await getProductFormOptions();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Import Products</h1>
      <ImportWorkspace categories={categories} brands={brands} />
    </div>
  );
}
