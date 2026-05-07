/*
  Warnings:

  - You are about to drop the column `email_notifications` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "email_notifications";

-- CreateTable
CREATE TABLE "threshold_dropdown_options" (
    "id" BIGSERIAL NOT NULL,
    "value" VARCHAR(50) NOT NULL,
    "display_label" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threshold_dropdown_options_pkey" PRIMARY KEY ("id")
);
