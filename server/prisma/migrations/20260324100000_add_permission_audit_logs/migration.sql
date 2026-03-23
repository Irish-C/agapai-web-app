-- CreateTable for PermissionAuditLog
CREATE TABLE "permission_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_name" VARCHAR(100) NOT NULL,
    "old_value" BOOLEAN,
    "new_value" BOOLEAN NOT NULL,
    "changed_by" BIGINT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "permission_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permission_audit_logs_role_id_idx" ON "permission_audit_logs"("role_id");

-- CreateIndex
CREATE INDEX "permission_audit_logs_permission_name_idx" ON "permission_audit_logs"("permission_name");

-- CreateIndex
CREATE INDEX "permission_audit_logs_changed_at_idx" ON "permission_audit_logs"("changed_at");

-- AddForeignKey
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
