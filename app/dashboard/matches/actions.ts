'use server'

import { prisma } from '@/lib/prisma'
import { MatchWithTeams } from '@/dashboard/matches/types'

export async function getPaginatedMatches({
                                              page = 1, perPage = 20, seasonId,
                                          }: { page?: number, perPage?: number, seasonId?: string }): Promise<{ matches: MatchWithTeams[]; total: number, activeSeasonId: string | undefined }> {
    // Fetch the latest active season if no seasonId is provided
    let activeSeasonId = seasonId
    if (!seasonId) {
        const latestActiveSeason = await prisma.season.findFirst({
            where: {isActive: true},
            orderBy: {startDate: 'desc'}, // Sort by startDate to get the most recent active season
        })
        activeSeasonId = latestActiveSeason?.id
    }

    const whereClause = activeSeasonId
        ? {seasonId: activeSeasonId}
        : {}

    const total = await prisma.match.count({
        where: whereClause,
    })

    const matches = await prisma.match.findMany({
        where: whereClause,
        include: {
            season: true,
            homeTeam: true,
            awayTeam: true,
        },
        orderBy: {date: 'asc'},
        skip: (page - 1) * perPage,
        take: perPage,
    })

    return {matches, total, activeSeasonId}
}
