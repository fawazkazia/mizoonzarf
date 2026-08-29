-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "variantAttributes" JSONB;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "attributeValues" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "product_variant_attributes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isColor" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "values" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variant_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_variant_attributes_productId_idx" ON "product_variant_attributes"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_attributes_productId_name_key" ON "product_variant_attributes"("productId", "name");

-- AddForeignKey
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
