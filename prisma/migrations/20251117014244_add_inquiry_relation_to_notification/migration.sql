/*
  Warnings:

  - A unique constraint covering the columns `[inquiryId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "inquiryId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_inquiryId_key" ON "Notification"("inquiryId");

-- CreateIndex
CREATE INDEX "Notification_inquiryId_idx" ON "Notification"("inquiryId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
