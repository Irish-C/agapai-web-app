-- AlterTable
ALTER TABLE "camera" DROP COLUMN IF EXISTS "emit_fall",
DROP COLUMN IF EXISTS "persist_fall",
DROP COLUMN IF EXISTS "emit_inactivity",
DROP COLUMN IF EXISTS "persist_inactivity";

-- AlterTable
ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "emit_fall",
DROP COLUMN IF EXISTS "persist_fall",
DROP COLUMN IF EXISTS "emit_inactivity",
DROP COLUMN IF EXISTS "persist_inactivity";
