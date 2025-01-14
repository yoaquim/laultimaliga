/*
  Warnings:

  - Made the column `teamId` on table `PlayerSeasonDetails` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Position" AS ENUM ('PG', 'SG', 'SF', 'PF', 'C', 'PG_SG', 'PG_SF', 'PG_PF', 'SG_SF', 'SG_PF', 'PF_C');

-- DropForeignKey
ALTER TABLE "PlayerSeasonDetails" DROP CONSTRAINT "PlayerSeasonDetails_teamId_fkey";

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "position" "Position";

-- AlterTable
ALTER TABLE "PlayerSeasonDetails" ALTER COLUMN "teamId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PlayerSeasonDetails" ADD CONSTRAINT "PlayerSeasonDetails_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
