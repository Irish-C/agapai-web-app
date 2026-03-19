/*
  Warnings:

  - Made the column `birthdate` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "camera" ADD COLUMN     "emit_fall" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emit_inactivity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "persist_fall" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "persist_inactivity" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "birthdate" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "global_settings" (
    "id" BIGSERIAL NOT NULL,
    "emit_fall" BOOLEAN NOT NULL DEFAULT true,
    "persist_fall" BOOLEAN NOT NULL DEFAULT true,
    "emit_inactivity" BOOLEAN NOT NULL DEFAULT false,
    "persist_inactivity" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);
