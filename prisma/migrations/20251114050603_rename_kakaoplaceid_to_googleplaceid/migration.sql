/*
  Warnings:

  - You are about to drop the column `kakaoPlaceId` on the `Restaurant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googlePlaceId]` on the table `Restaurant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `googlePlaceId` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Restaurant_kakaoPlaceId_key";

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "kakaoPlaceId",
ADD COLUMN     "googlePlaceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_googlePlaceId_key" ON "Restaurant"("googlePlaceId");
