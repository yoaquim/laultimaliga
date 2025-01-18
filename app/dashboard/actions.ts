'use server'

import { isAdmin } from '@/lib/rba'
import { ProfileWithDetails, SeasonOption } from '@/dashboard/types'
import { prisma } from '@/lib/prisma'

export async function getIsAdmin() {
    return await isAdmin()
}

export async function getAllSeasons(): Promise<SeasonOption[]> {
    // Map seasons to an array of SeasonOption (adjust formatting as needed)
    const seasons = await prisma.season.findMany({orderBy: {startDate: 'desc'},})
    return seasons.map(({name, id}) => ({name, id}))
}

/**
 * Fetch a player’s details for a given season.
 * This function returns:
 *   - The user data,
 *   - The player's total stats,
 *   - The player's season stats filtered to the given season,
 *   - The player's season details (to get team info) for the given season,
 *   - The player's participations in matches whose seasonId matches.
 *
 * The participations are then sorted by the match date (ascending).
 *
 * @param playerId - The player's ID
 * @param seasonId - The season ID to filter by
 * @returns The player details filtered to the given season, or null if not found.
 */
export async function getPlayerStatsForSeason(
    playerId: string,
    seasonId?: string
): Promise<ProfileWithDetails | null> {
    const player = await prisma.player.findUnique({
        where: {id: playerId},
        include: {
            user: true,
            totalStats: true,
            SeasonStats: {
                where: {seasonId},
                include: {season: true},
            },
            seasonDetails: {
                where: {seasonId},
                include: {
                    season: true,
                    team: true
                },
            },
            participations: {
                // Only include participations where the match's seasonId matches.
                where: {match: {seasonId},},
                include: {
                    match: {
                        include: {
                            homeTeam: true,
                            awayTeam: true,
                            season: true,
                        },
                    },
                    stats: true,
                },
            },
        },
    })

    if (player && Array.isArray(player.participations)) {
        // Sort the participations in ascending order of the match date.
        player.participations.sort((a, b) => {
            const dateA = new Date(a.match.date).getTime()
            const dateB = new Date(b.match.date).getTime()
            return dateA - dateB
        })
    }

    return player
}
