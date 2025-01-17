'use server'

import { prisma } from '@/lib/prisma'
import { TeamWithStats } from './types'

/**
 * Fetch paginated teams that are in a given season.
 * If no seasonId is provided, the latest active season is used.
 *
 * @param page - The current page (default: 1)
 * @param perPage - Number of teams per page (default: 20)
 * @param seasonId - Optional; if not provided, the latest active season is used.
 * @returns An object with teams, total count, and activeSeasonId used in filtering.
 */
export async function getPaginatedTeams({
                                            page = 1,
                                            perPage = 20,
                                            seasonId,
                                        }: {
    page?: number;
    perPage?: number;
    seasonId?: string;
}): Promise<{ teams: TeamWithStats[]; total: number; activeSeasonId: string | undefined }> {
    // Determine the active season ID if not provided.
    let activeSeasonId = seasonId
    if (!seasonId) {
        const latestActiveSeason = await prisma.season.findFirst({
            where: {isActive: true},
            orderBy: {startDate: 'desc'},
        })
        activeSeasonId = latestActiveSeason?.id
    }

    // Build the where clause: we only want teams that belong to the active season.
    const whereClause = activeSeasonId ? {seasonId: activeSeasonId} : {}

    // Count how many teams match the criteria.
    const total = await prisma.team.count({
        where: whereClause,
    })

    // Fetch the teams with their associated data.
    const teamsRaw = await prisma.team.findMany({
        where: whereClause,
        include: {
            season: true,
            wins: true,
            homeMatches: true,
            awayMatches: true,
            players: true,  // These are the PlayerSeasonDetails entries.
        },
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * perPage,
        take: perPage,
    })

    // Compute the stats (totalMatches, matchesWon, winRate) for each team.
    const teams: TeamWithStats[] = teamsRaw.map((team) => {
        const totalMatches = team.homeMatches.length + team.awayMatches.length
        const matchesWon = team.wins.length
        const winRate = totalMatches > 0 ? ((matchesWon / totalMatches) * 100).toFixed(2) : 'N/A'
        return {
            ...team,
            totalMatches,
            matchesWon,
            winRate,
        }
    })

    return {teams, total, activeSeasonId}
}
