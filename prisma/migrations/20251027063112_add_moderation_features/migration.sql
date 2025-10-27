-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "needsModeration" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "needsModeration" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProfanityWord" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfanityWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfanityWord_word_key" ON "ProfanityWord"("word");

-- CreateIndex
CREATE INDEX "Review_needsModeration_idx" ON "Review"("needsModeration");

-- CreateIndex
CREATE INDEX "Tag_needsModeration_idx" ON "Tag"("needsModeration");
