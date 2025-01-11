/*
  Warnings:

  - You are about to drop the column `number` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the `Transfer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_fromTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_toTeamId_fkey";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "number",
DROP COLUMN "teamId";

-- DropTable
DROP TABLE "Transfer";

-- CreateTable
CREATE TABLE "PlayerSeasonDetails" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamId" TEXT,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSeasonDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonDetails_playerId_seasonId_key" ON "PlayerSeasonDetails"("playerId", "seasonId");

-- AddForeignKey
ALTER TABLE "PlayerSeasonDetails" ADD CONSTRAINT "PlayerSeasonDetails_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonDetails" ADD CONSTRAINT "PlayerSeasonDetails_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonDetails" ADD CONSTRAINT "PlayerSeasonDetails_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
