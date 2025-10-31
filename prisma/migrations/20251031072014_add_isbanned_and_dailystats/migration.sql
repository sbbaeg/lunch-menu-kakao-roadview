-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DailyStat" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "newReviews" INTEGER NOT NULL DEFAULT 0,
    "newTags" INTEGER NOT NULL DEFAULT 0,
    "newRestaurantVotes" INTEGER NOT NULL DEFAULT 0,
    "newReviewVotes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_date_key" ON "DailyStat"("date");
