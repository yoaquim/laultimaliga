/*
  Warnings:

  - You are about to drop the column `date` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `PlayerMatchStats` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `PlayerMatchStats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[playerMatchParticipationId]` on the table `PlayerMatchStats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `playerMatchParticipationId` to the `PlayerMatchStats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PlayerMatchStats" DROP CONSTRAINT "PlayerMatchStats_matchId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerMatchStats" DROP CONSTRAINT "PlayerMatchStats_playerId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "date";

-- AlterTable
ALTER TABLE "PlayerMatchStats" DROP COLUMN "matchId",
DROP COLUMN "playerId",
ADD COLUMN     "playerMatchParticipationId" TEXT NOT NULL,
ALTER COLUMN "points" SET DEFAULT 0,
ALTER COLUMN "assists" SET DEFAULT 0,
ALTER COLUMN "rebounds" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "PlayerMatchParticipation" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMatchParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchParticipation_playerId_matchId_key" ON "PlayerMatchParticipation"("playerId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchStats_playerMatchParticipationId_key" ON "PlayerMatchStats"("playerMatchParticipationId");

-- AddForeignKey
ALTER TABLE "PlayerMatchParticipation" ADD CONSTRAINT "PlayerMatchParticipation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchParticipation" ADD CONSTRAINT "PlayerMatchParticipation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchStats" ADD CONSTRAINT "PlayerMatchStats_playerMatchParticipationId_fkey" FOREIGN KEY ("playerMatchParticipationId") REFERENCES "PlayerMatchParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
