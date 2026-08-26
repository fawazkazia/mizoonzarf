-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "country" SET DEFAULT 'IN';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "hsnCode" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "customerGstin" TEXT,
ADD COLUMN     "igstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "invoiceDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "sellerGstin" TEXT,
ADD COLUMN     "sellerState" TEXT,
ADD COLUMN     "sgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "gstRate" DECIMAL(5,2),
ADD COLUMN     "hsnCode" TEXT;

-- CreateTable
CREATE TABLE "invoice_counters" (
    "id" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_counters_financialYear_key" ON "invoice_counters"("financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "orders_invoiceNumber_key" ON "orders"("invoiceNumber");

