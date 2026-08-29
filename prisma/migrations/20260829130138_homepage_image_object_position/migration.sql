-- CreateEnum
CREATE TYPE "ObjectPosition" AS ENUM ('CENTER', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "imageObjectPosition" "ObjectPosition";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "imageObjectPosition" "ObjectPosition";

-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "imageObjectPosition" "ObjectPosition";
