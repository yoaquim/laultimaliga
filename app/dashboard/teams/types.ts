import { Prisma } from '@prisma/client'

export type TeamWithStats = Prisma.TeamGetPayload<{
    include: {
        season: true;
        wins: true;
        homeMatches: true;
        awayMatches: true;
        players: true;
    }
}> & {
    totalMatches: number;
    matchesWon: number;
    winRate: string;
}
