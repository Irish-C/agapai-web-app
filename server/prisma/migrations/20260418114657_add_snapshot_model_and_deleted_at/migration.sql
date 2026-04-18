/*
  Warnings:

  - You are about to drop the column `email_fallback` on the `global_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event_logs" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "global_settings" DROP COLUMN "email_fallback";

-- CreateTable
CREATE TABLE "snapshots" (
    "id" BIGSERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_log_id" BIGINT NOT NULL,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_event_log_id_fkey" FOREIGN KEY ("event_log_id") REFERENCES "event_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
