-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "isPractice" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "isActive" SET DEFAULT false;
