'use server'
import { prisma } from '@/lib/prisma'
import { PlayerWithDetails } from '@/dashboard/players/types'

/**
 * Fetch paginated players that played in a given season.
 * If no seasonId is provided, the latest active season is used.
 *
 * @param page - the current page (default 1)
 * @param perPage - number of players per page (default 20)
 * @param seasonId - optional; if not provided, the latest active season is used
 * @returns an object with players, total count, and activeSeasonId used in filtering.
 */
export async function getPaginatedPlayers({
                                              page = 1,
                                              perPage = 20,
                                              seasonId,
                                          }: {
    page?: number
    perPage?: number
    seasonId?: string
}): Promise<{ players: PlayerWithDetails[]; total: number; activeSeasonId: string | undefined }> {
    // If no seasonId is provided, fetch the latest active season.
    let activeSeasonId = seasonId
    if (!seasonId) {
        const latestActiveSeason = await prisma.season.findFirst({
            where: {isActive: true},
            orderBy: {startDate: 'desc'},
        })
        activeSeasonId = latestActiveSeason?.id
    }

    // Build the "where" clause.
    // We only want players with season details for the activeSeasonId.
    const whereClause = activeSeasonId
        ? {seasonDetails: {some: {seasonId: activeSeasonId}}}
        : {}

    // Count how many players match the criteria.
    const total = await prisma.player.count({
        where: whereClause,
    })

    // Fetch the players with their details.
    const players = await prisma.player.findMany({
        where: whereClause,
        include: {
            user: true,
            seasonDetails: {
                include: {
                    team: {
                        include: {
                            season: true,
                        },
                    },
                },
            },
            SeasonStats: true,
            totalStats: true,
            participations: true,
        },
        orderBy: {createdAt: 'asc'},
        skip: (page - 1) * perPage,
        take: perPage,
        distinct: ['id'], // ensures that each player is returned only once
    })

    return {players, total, activeSeasonId}
}
