-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "adminReply" TEXT,
ADD COLUMN     "isReadByUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '제목 없음';
