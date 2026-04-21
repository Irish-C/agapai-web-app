-- CreateTable
CREATE TABLE "thresholds" (
    "id" BIGSERIAL NOT NULL,
    "low" INTEGER NOT NULL DEFAULT 0,
    "medium" INTEGER NOT NULL DEFAULT 0,
    "high" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thresholds_pkey" PRIMARY KEY ("id")
);
