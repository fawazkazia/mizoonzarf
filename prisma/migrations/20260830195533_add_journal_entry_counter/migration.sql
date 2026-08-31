-- CreateTable
CREATE TABLE "journal_entry_counters" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entry_counters_pkey" PRIMARY KEY ("id")
);
