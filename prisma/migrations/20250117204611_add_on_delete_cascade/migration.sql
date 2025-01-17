-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_awayTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_homeTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_userId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerMatchParticipation" DROP CONSTRAINT "PlayerMatchParticipation_matchId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerMatchParticipation" DROP CONSTRAINT "PlayerMatchParticipation_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerMatchStats" DROP CONSTRAINT "PlayerMatchStats_playerMatchParticipationId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerSeasonDetails" DROP CONSTRAINT "PlayerSeasonDetails_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerSeasonDetails" DROP CONSTRAINT "PlayerSeasonDetails_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerSeasonDetails" DROP CONSTRAINT "PlayerSeasonDetails_teamId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerSeasonStats" DROP CONSTRAINT "PlayerSeasonStats_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerSeasonStats" DROP CONSTRAINT "PlayerSeasonStats_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerTotalStats" DROP CONSTRAINT "PlayerTotalStats_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_seasonId_fkey";

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerTotalStats" ADD CONSTRAINT "PlayerTotalStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonDetails" ADD CONSTRAINT "PlayerSeasonDetails_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonDetails" ADD CONSTRAINT "PlayerSeasonDetails_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonDetails" ADD CONSTRAINT "PlayerSeasonDetails_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStats" ADD CONSTRAINT "PlayerSeasonStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStats" ADD CONSTRAINT "PlayerSeasonStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchParticipation" ADD CONSTRAINT "PlayerMatchParticipation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchParticipation" ADD CONSTRAINT "PlayerMatchParticipation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchStats" ADD CONSTRAINT "PlayerMatchStats_playerMatchParticipationId_fkey" FOREIGN KEY ("playerMatchParticipationId") REFERENCES "PlayerMatchParticipation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
