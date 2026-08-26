-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('PHONE_VERIFY', 'COD_RISK_CONFIRM');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "ReliabilityStatus" AS ENUM ('TRUSTED', 'NORMAL', 'HIGH_RISK');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "codConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "riskReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "reliabilityOverride" "ReliabilityStatus",
ADD COLUMN     "reliabilityOverrideAt" TIMESTAMP(3),
ADD COLUMN     "reliabilityOverrideBy" TEXT,
ADD COLUMN     "reliabilityOverrideNote" TEXT,
ADD COLUMN     "reliabilityStatus" "ReliabilityStatus" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "consumedAt" TIMESTAMP(3),
    "requesterIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verified_phones" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "guestToken" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "orderId" TEXT,

    CONSTRAINT "verified_phones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_otps_phone_purpose_createdAt_idx" ON "phone_otps"("phone", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "phone_otps_requesterIp_createdAt_idx" ON "phone_otps"("requesterIp", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "verified_phones_guestToken_key" ON "verified_phones"("guestToken");

-- CreateIndex
CREATE INDEX "verified_phones_phone_idx" ON "verified_phones"("phone");

-- CreateIndex
CREATE INDEX "verified_phones_userId_idx" ON "verified_phones"("userId");

-- CreateIndex
CREATE INDEX "orders_riskLevel_idx" ON "orders"("riskLevel");

-- AddForeignKey
ALTER TABLE "phone_otps" ADD CONSTRAINT "phone_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verified_phones" ADD CONSTRAINT "verified_phones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
