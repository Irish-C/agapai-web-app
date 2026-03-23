-- AlterTable
ALTER TABLE "category_permissions" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "parent_role_id" BIGINT;

-- CreateIndex
CREATE INDEX "category_permissions_role_id_idx" ON "category_permissions"("role_id");

-- CreateIndex
CREATE INDEX "category_permissions_category_id_idx" ON "category_permissions"("category_id");

-- CreateIndex
CREATE INDEX "category_permissions_role_id_category_id_idx" ON "category_permissions"("role_id", "category_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_name_idx" ON "role_permissions"("permission_name");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_permission_name_idx" ON "role_permissions"("role_id", "permission_name");

-- CreateIndex
CREATE INDEX "roles_parent_role_id_idx" ON "roles"("parent_role_id");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
