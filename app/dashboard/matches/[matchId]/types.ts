import { Prisma } from '@prisma/client'

export type MatchWithDetails = Prisma.MatchGetPayload<{
    include: {
        homeTeam: true
        awayTeam: true
        season: true
        participations: {
            include: {
                player: {
                    include: {
                        user: true
                        team: true
                    }
                }
                stats: true
            }
        }
    }
}>

export type StatType = 'points' | 'assists' | 'rebounds'
