-- CreateTable
CREATE TABLE "attribute_value_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isColor" BOOLEAN NOT NULL DEFAULT false,
    "values" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_value_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attribute_value_library_name_key" ON "attribute_value_library"("name");
