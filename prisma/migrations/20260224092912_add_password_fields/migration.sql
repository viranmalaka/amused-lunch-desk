-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT,
ADD COLUMN     "passwordUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "tempPassword" BOOLEAN NOT NULL DEFAULT false;
