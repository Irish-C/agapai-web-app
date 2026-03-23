-- CreateTable category_features
CREATE TABLE "category_features" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "feature_key" VARCHAR(100) NOT NULL,
    "feature_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable category_feature_permissions
CREATE TABLE "category_feature_permissions" (
    "id" BIGSERIAL NOT NULL,
    "feature_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,

    CONSTRAINT "category_feature_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable feature_audit_logs
CREATE TABLE "feature_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "feature_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "feature_key" VARCHAR(100) NOT NULL,
    "feature_name" VARCHAR(150) NOT NULL,
    "old_value" BOOLEAN,
    "new_value" BOOLEAN NOT NULL,
    "changed_by" BIGINT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_features_category_id_feature_key_key" ON "category_features"("category_id", "feature_key");

-- CreateIndex
CREATE INDEX "category_features_category_id_idx" ON "category_features"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_feature_permissions_feature_id_role_id_key" ON "category_feature_permissions"("feature_id", "role_id");

-- CreateIndex
CREATE INDEX "category_feature_permissions_role_id_idx" ON "category_feature_permissions"("role_id");

-- CreateIndex
CREATE INDEX "category_feature_permissions_feature_id_idx" ON "category_feature_permissions"("feature_id");

-- CreateIndex
CREATE INDEX "category_feature_permissions_role_id_feature_id_idx" ON "category_feature_permissions"("role_id", "feature_id");

-- CreateIndex
CREATE INDEX "feature_audit_logs_role_id_idx" ON "feature_audit_logs"("role_id");

-- CreateIndex
CREATE INDEX "feature_audit_logs_changed_by_idx" ON "feature_audit_logs"("changed_by");

-- AddForeignKey
ALTER TABLE "category_features" ADD CONSTRAINT "category_features_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "settings_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_feature_permissions" ADD CONSTRAINT "category_feature_permissions_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "category_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_feature_permissions" ADD CONSTRAINT "category_feature_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_feature_permissions" ADD CONSTRAINT "category_feature_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_audit_logs" ADD CONSTRAINT "feature_audit_logs_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_audit_logs" ADD CONSTRAINT "feature_audit_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
