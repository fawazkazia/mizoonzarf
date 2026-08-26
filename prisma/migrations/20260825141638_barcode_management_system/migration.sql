-- CreateEnum
CREATE TYPE "BarcodeType" AS ENUM ('CODE128', 'EAN13', 'UPC_A', 'QR');

-- CreateEnum
CREATE TYPE "BarcodeSource" AS ENUM ('GENERATED', 'MANUFACTURER');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIVE', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'ORDER_RESERVED', 'ORDER_FULFILLED', 'ORDER_CANCELLED_RELEASE', 'RETURN_RESTOCK', 'RETURN_DAMAGED');

-- CreateEnum
CREATE TYPE "ScanContext" AS ENUM ('GENERAL_SEARCH', 'RECEIVING', 'ORDER_PACKING', 'RETURN', 'STOCK_ADJUST');

-- CreateEnum
CREATE TYPE "ReturnResolution" AS ENUM ('RESTOCK', 'DAMAGED', 'EXCHANGE', 'REFUND', 'INSPECTION_REQUIRED');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "packedQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "packingStartedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "barcodeGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "barcodeSource" "BarcodeSource",
ADD COLUMN     "barcodeType" "BarcodeType";

-- AlterTable
ALTER TABLE "returns" ADD COLUMN     "resolution" "ReturnResolution",
ADD COLUMN     "restockedAt" TIMESTAMP(3),
ADD COLUMN     "warehouseId" TEXT;

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_warehouse_stock" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "variant_warehouse_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode_scan_logs" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "variantId" TEXT,
    "found" BOOLEAN NOT NULL,
    "context" "ScanContext" NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barcode_scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode_print_logs" (
    "id" TEXT NOT NULL,
    "variantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "labelCount" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barcode_print_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode_duplicate_attempts" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "variantId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barcode_duplicate_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode_counters" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barcode_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "variant_warehouse_stock_variantId_warehouseId_key" ON "variant_warehouse_stock"("variantId", "warehouseId");

-- CreateIndex
CREATE INDEX "stock_movements_variantId_idx" ON "stock_movements"("variantId");

-- CreateIndex
CREATE INDEX "stock_movements_warehouseId_idx" ON "stock_movements"("warehouseId");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE INDEX "barcode_scan_logs_createdAt_idx" ON "barcode_scan_logs"("createdAt");

-- CreateIndex
CREATE INDEX "barcode_scan_logs_barcode_idx" ON "barcode_scan_logs"("barcode");

-- CreateIndex
CREATE INDEX "barcode_print_logs_createdAt_idx" ON "barcode_print_logs"("createdAt");

-- CreateIndex
CREATE INDEX "barcode_duplicate_attempts_createdAt_idx" ON "barcode_duplicate_attempts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "barcode_counters_prefix_key" ON "barcode_counters"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_warehouse_stock" ADD CONSTRAINT "variant_warehouse_stock_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_warehouse_stock" ADD CONSTRAINT "variant_warehouse_stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_scan_logs" ADD CONSTRAINT "barcode_scan_logs_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_scan_logs" ADD CONSTRAINT "barcode_scan_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_print_logs" ADD CONSTRAINT "barcode_print_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_duplicate_attempts" ADD CONSTRAINT "barcode_duplicate_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
