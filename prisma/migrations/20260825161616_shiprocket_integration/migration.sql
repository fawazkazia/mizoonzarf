-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "awbCode" TEXT,
ADD COLUMN     "codAmount" DECIMAL(10,2),
ADD COLUMN     "courierId" TEXT,
ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "deliveryException" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "lastApiResponse" JSONB,
ADD COLUMN     "lastApiStatus" TEXT,
ADD COLUMN     "lastTrackingSyncAt" TIMESTAMP(3),
ADD COLUMN     "manifestUrl" TEXT,
ADD COLUMN     "packageHeight" DOUBLE PRECISION,
ADD COLUMN     "packageLength" DOUBLE PRECISION,
ADD COLUMN     "packageWeight" DOUBLE PRECISION,
ADD COLUMN     "packageWidth" DOUBLE PRECISION,
ADD COLUMN     "pickupScheduledAt" TIMESTAMP(3),
ADD COLUMN     "pickupStatus" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shiprocketOrderId" TEXT,
ADD COLUMN     "shiprocketShipmentId" TEXT,
ADD COLUMN     "trackingStatus" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'IN',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "shiprocketPickupLocation" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "activity" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shiprocket_tokens" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shiprocket_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipment_events_shipmentId_idx" ON "shipment_events"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_events_shipmentId_status_occurredAt_key" ON "shipment_events"("shipmentId", "status", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_idempotencyKey_key" ON "shipments"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

