-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'INQUIRY_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_MESSAGE';

-- DropIndex
DROP INDEX "Tag_name_userId_key";

-- DropIndex
DROP INDEX "Tag_needsModeration_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "reviewId" INTEGER,
ADD COLUMN     "tagId" INTEGER;

-- CreateIndex
CREATE INDEX "Notification_tagId_idx" ON "Notification"("tagId");

-- CreateIndex
CREATE INDEX "Notification_reviewId_idx" ON "Notification"("reviewId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
