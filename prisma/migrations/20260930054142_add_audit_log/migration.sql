-- CreateEnum
CREATE TYPE "AuditActor" AS ENUM ('USER', 'API_KEY');

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor" "AuditActor" NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "targetId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_resource_targetId_idx" ON "audit_log"("resource", "targetId");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
