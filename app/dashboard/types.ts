import { Prisma } from '@prisma/client'

export interface SeasonOption {
    name: string
    id: string
}

export type ProfileWithDetails = Prisma.PlayerGetPayload<{
    include: {
        user: true
        totalStats: true
        SeasonStats: {
            include: { season: true },
        }
        seasonDetails: {
            include: {
                season: true
                team: true
            }
        }
        participations: {
            include: {
                match: {
                    include: {
                        homeTeam: true
                        awayTeam: true
                        season: true
                    }
                }
                stats: true
            }
        }
    }
}>