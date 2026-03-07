-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "lastname" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role_id" BIGINT,
    "email_notifications" BOOLEAN NOT NULL DEFAULT false,
    "alert_threshold" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" BIGSERIAL NOT NULL,
    "loc_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "id" BIGSERIAL NOT NULL,
    "event_type_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_class" (
    "id" BIGSERIAL NOT NULL,
    "class_name" VARCHAR(100) NOT NULL,
    "event_type_id" BIGINT NOT NULL,

    CONSTRAINT "event_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera" (
    "id" BIGSERIAL NOT NULL,
    "cam_name" VARCHAR(100) NOT NULL,
    "cam_status" BOOLEAN NOT NULL DEFAULT true,
    "stream_url" VARCHAR(255) NOT NULL,
    "loc_id" BIGINT,

    CONSTRAINT "camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_status" VARCHAR(50) NOT NULL DEFAULT 'unacknowledged',
    "file_path" VARCHAR(255),
    "cam_id" BIGINT,
    "event_class_id" BIGINT,
    "ack_by_user_id" BIGINT,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "location_loc_name_key" ON "location"("loc_name");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_event_type_name_key" ON "event_type"("event_type_name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_class" ADD CONSTRAINT "event_class_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera" ADD CONSTRAINT "camera_loc_id_fkey" FOREIGN KEY ("loc_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_ack_by_user_id_fkey" FOREIGN KEY ("ack_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_cam_id_fkey" FOREIGN KEY ("cam_id") REFERENCES "camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_event_class_id_fkey" FOREIGN KEY ("event_class_id") REFERENCES "event_class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
