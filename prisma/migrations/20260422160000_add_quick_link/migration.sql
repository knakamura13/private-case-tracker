-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'QUICK_LINK_CREATED';
ALTER TYPE "ActivityAction" ADD VALUE 'QUICK_LINK_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'QUICK_LINK_DELETED';

-- CreateTable
CREATE TABLE "QuickLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "QuickLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuickLink_workspaceId_order_idx" ON "QuickLink"("workspaceId", "order");

-- AddForeignKey
ALTER TABLE "QuickLink" ADD CONSTRAINT "QuickLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
