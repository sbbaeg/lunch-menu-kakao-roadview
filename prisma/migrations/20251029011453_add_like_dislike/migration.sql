-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "dislikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RestaurantVote" (
    "userId" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "type" "VoteType" NOT NULL,

    CONSTRAINT "RestaurantVote_pkey" PRIMARY KEY ("userId","restaurantId")
);

-- AddForeignKey
ALTER TABLE "RestaurantVote" ADD CONSTRAINT "RestaurantVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantVote" ADD CONSTRAINT "RestaurantVote_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
