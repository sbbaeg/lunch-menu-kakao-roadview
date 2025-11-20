-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyOnBestReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnInquiryReply" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnNewBadge" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnReviewUpvote" BOOLEAN NOT NULL DEFAULT true;
