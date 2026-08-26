-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "categorySlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "customerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "returns" ADD COLUMN     "adminNote" TEXT;
