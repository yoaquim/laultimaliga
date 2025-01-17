import { Prisma } from '@prisma/client'

export type PlayerWithDetails = Prisma.PlayerGetPayload<{
    include: {
        user: true
        seasonDetails: {
            include: {
                team: {
                    include: { season: true }
                }
            }
        }
        SeasonStats: true
        totalStats: true
        participations: true
    }
}>