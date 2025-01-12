/*
  Warnings:

  - A unique constraint covering the columns `[playerId,seasonId]` on the table `SeasonStats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SeasonStats" ALTER COLUMN "points" SET DEFAULT 0,
ALTER COLUMN "assists" SET DEFAULT 0,
ALTER COLUMN "rebounds" SET DEFAULT 0,
ALTER COLUMN "gamesPlayed" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "SeasonStats_playerId_seasonId_key" ON "SeasonStats"("playerId", "seasonId");
