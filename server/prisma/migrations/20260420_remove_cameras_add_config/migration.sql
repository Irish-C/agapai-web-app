-- Remove camera_id foreign key from event_logs
ALTER TABLE "event_logs" DROP CONSTRAINT IF EXISTS "event_logs_cam_id_fkey";

-- Remove camera_id column from event_logs
ALTER TABLE "event_logs" DROP COLUMN IF EXISTS "cam_id";

-- Drop camera table
DROP TABLE IF EXISTS "camera";

-- Create new camera_config singleton table
CREATE TABLE "camera_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cam_name" VARCHAR(100) NOT NULL,
    "stream_url" VARCHAR(255) NOT NULL,
    "loc_id" BIGINT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "camera_config_pkey" PRIMARY KEY ("id")
);

-- Create a constraint to enforce singleton (only id=1 allowed)
CREATE UNIQUE INDEX "camera_config_id_key" ON "camera_config"("id");
