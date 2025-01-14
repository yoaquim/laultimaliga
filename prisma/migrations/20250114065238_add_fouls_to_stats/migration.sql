/*
  Warnings:

  - You are about to drop the `SeasonStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SeasonStats" DROP CONSTRAINT "SeasonStats_playerId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonStats" DROP CONSTRAINT "SeasonStats_seasonId_fkey";

-- AlterTable
ALTER TABLE "PlayerMatchStats" ADD COLUMN     "fouls" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlayerTotalStats" ADD COLUMN     "fouls" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "points" SET DEFAULT 0,
ALTER COLUMN "assists" SET DEFAULT 0,
ALTER COLUMN "rebounds" SET DEFAULT 0,
ALTER COLUMN "gamesPlayed" SET DEFAULT 0;

-- DropTable
DROP TABLE "SeasonStats";

-- CreateTable
CREATE TABLE "PlayerSeasonStats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "rebounds" INTEGER NOT NULL DEFAULT 0,
    "fouls" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSeasonStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStats_playerId_seasonId_key" ON "PlayerSeasonStats"("playerId", "seasonId");

-- AddForeignKey
ALTER TABLE "PlayerSeasonStats" ADD CONSTRAINT "PlayerSeasonStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStats" ADD CONSTRAINT "PlayerSeasonStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
