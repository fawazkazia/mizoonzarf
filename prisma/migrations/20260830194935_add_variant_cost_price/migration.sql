-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "costPriceSnapshot" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "costPrice" DECIMAL(10,2);
