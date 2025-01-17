import { Prisma } from '@prisma/client'

export type MatchWithTeams = Prisma.MatchGetPayload<{
    include: {
        season: true
        homeTeam: true
        awayTeam: true
    }
}>
