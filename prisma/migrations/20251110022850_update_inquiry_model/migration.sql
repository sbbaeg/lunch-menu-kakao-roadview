/*
  Warnings:

  - Added the required column `title` to the `Inquiry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "adminReply" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;
