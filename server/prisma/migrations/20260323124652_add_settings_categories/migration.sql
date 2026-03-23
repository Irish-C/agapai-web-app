-- CreateTable
CREATE TABLE "settings_categories" (
    "id" BIGSERIAL NOT NULL,
    "category_key" VARCHAR(100) NOT NULL,
    "category_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "icon_class" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_permissions" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "allowed_functions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,

    CONSTRAINT "category_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_categories_category_key_key" ON "settings_categories"("category_key");

-- CreateIndex
CREATE UNIQUE INDEX "category_permissions_category_id_role_id_key" ON "category_permissions"("category_id", "role_id");

-- AddForeignKey
ALTER TABLE "category_permissions" ADD CONSTRAINT "category_permissions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "settings_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_permissions" ADD CONSTRAINT "category_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_permissions" ADD CONSTRAINT "category_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
