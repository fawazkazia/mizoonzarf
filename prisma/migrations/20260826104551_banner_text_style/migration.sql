-- CreateEnum
CREATE TYPE "BannerTextSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- DropIndex
DROP INDEX "products_name_trgm_idx";

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "subtitleColor" TEXT,
ADD COLUMN     "titleColor" TEXT,
ADD COLUMN     "titleSize" "BannerTextSize" NOT NULL DEFAULT 'MEDIUM';
