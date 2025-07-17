'use server'

import { MatchStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { StatType } from './types'
import { requireAdmin } from '@/lib/rba'

export async function getMatch(matchId: string) {
    // Use a transaction to fetch the seasonId and full match details
    const [seasonInfo, fullMatchDetails] = await prisma.$transaction([
        prisma.match.findUnique({
            where: {id: matchId},
            select: {seasonId: true},
        }),
        prisma.match.findUnique({
            where: {id: matchId},
            include: {
                homeTeam: {
                    include: {
                        players: {
                            include: {
                                player: {
                                    include: {
                                        user: true,
                                        seasonDetails: true, // Placeholders for filtering
                                    },
                                },
                            },
                        },
                    },
                },
                awayTeam: {
                    include: {
                        players: {
                            include: {
                                player: {
                                    include: {
                                        user: true,
                                        seasonDetails: true, // Placeholders for filtering
                                    },
                                },
                            },
                        },
                    },
                },
                season: true,
                participations: {
                    include: {
                        player: {
                            include: {user: true},
                        },
                        stats: true,
                    },
                },
            },
        }),
    ])

    // Check if both queries returned valid results
    if (!seasonInfo || !fullMatchDetails) {
        throw new Error('Match not found')
    }

    const {seasonId} = seasonInfo

    // Filter seasonDetails in-memory for the relevant seasonId
    fullMatchDetails.homeTeam.players.forEach((player) => {
        player.player.seasonDetails = player.player.seasonDetails.filter(
            (detail) => detail.seasonId === seasonId
        )
    })

    fullMatchDetails.awayTeam.players.forEach((player) => {
        player.player.seasonDetails = player.player.seasonDetails.filter(
            (detail) => detail.seasonId === seasonId
        )
    })

    return fullMatchDetails
}

/**
 * Updates match status. If new status is COMPLETED, we finalize the match:
 *   - increment `gamesPlayed` in `PlayerTotalStats` for each participant
 *   - increment `gamesPlayed` in `PlayerSeasonStats` for each participant in that season
 *   - And set the winnerId (randomly choosing between homeTeamId and awayTeamId)
 */
export async function updateMatchStatus(matchId: string, status: MatchStatus) {
    await requireAdmin()
    return prisma.$transaction(
        async (tx) => {
            // 1) Update the match and select homeTeamId and awayTeamId as well
            const updatedMatch = await tx.match.update({
                where: {id: matchId},
                data: {status},
                select: {
                    id: true,
                    season: true,
                    homeTeamId: true,
                    awayTeamId: true,
                    homeScore: true,
                    awayScore: true,
                },
            })

            // 2) If COMPLETED, update gamesPlayed and also set the winnerId
            if (status === 'COMPLETED') {
                const participants = await tx.playerMatchParticipation.findMany({
                    where: {matchId},
                })

                // Only update gamesPlayed for players who were actually playing
                const playingParticipants = participants.filter(p => p.isPlaying)

                for (const p of playingParticipants) {
                    const playerId = p.playerId

                    // update total stats (increment gamesPlayed by 1)
                    await tx.playerTotalStats.updateMany({
                        where: {playerId},
                        data: {
                            gamesPlayed: {
                                increment: 1,
                            },
                        },
                    })

                    // update season stats
                    if (updatedMatch.season) {
                        const seasonId = updatedMatch.season.id
                        await tx.playerSeasonStats.upsert({
                            where: {
                                playerId_seasonId: {
                                    playerId,
                                    seasonId,
                                },
                            },
                            create: {
                                playerId,
                                seasonId,
                                gamesPlayed: 1,
                                points: 0,
                                assists: 0,
                                rebounds: 0,
                                fouls: 0,
                            },
                            update: {
                                gamesPlayed: {
                                    increment: 1,
                                },
                            },
                        })
                    }
                }

                // 3) Determine the winner based on the current scoreboard
                // (Assuming the match's homeScore and awayScore have been kept up-to-date via stat updates)
                let winnerId
                if (updatedMatch.homeScore > updatedMatch.awayScore) {
                    winnerId = updatedMatch.homeTeamId
                } else if (updatedMatch.awayScore > updatedMatch.homeScore) {
                    winnerId = updatedMatch.awayTeamId
                } else {
                    // In case of a tie, you might leave winnerId as null
                    // or define some tie-breaker logic.
                    winnerId = null
                }

                // Update the match to set the winnerId
                await tx.match.update({
                    where: {id: matchId},
                    data: {winnerId},
                })
            }

            return updatedMatch
        },
        {
            timeout: 10_000, // 10 seconds
        }
    )
}

/**
 * Update a player's stats (points/assists/rebounds) for a single match participation,
 * plus update scoreboard (if points), PlayerTotalStats & SeasonStats.
 */
/**
 * Toggle a player's participation status (isPlaying) for a match
 */
export async function togglePlayerParticipation(participationId: string) {
    await requireAdmin()
    return prisma.$transaction(async (tx) => {
        // Get current participation
        const participation = await tx.playerMatchParticipation.findUnique({
            where: { id: participationId },
            include: { match: true }
        })
        
        if (!participation) {
            throw new Error('Participation not found')
        }
        
        // Only allow toggling if match is not completed
        if (participation.match.status === 'COMPLETED') {
            throw new Error('Cannot modify participation for completed matches')
        }
        
        // Toggle the isPlaying status
        const updatedParticipation = await tx.playerMatchParticipation.update({
            where: { id: participationId },
            data: { isPlaying: !participation.isPlaying }
        })
        
        return updatedParticipation
    })
}

export async function updatePlayerStat(playerStatId: string, statType: StatType, increment: boolean) {
    await requireAdmin()
    return prisma.$transaction(async (tx) => {
        // ----------------------------------------------------------------------
        // 1) Update PlayerMatchStats (the individual's stat row for that match)
        // ----------------------------------------------------------------------
        const updatedStat = await tx.playerMatchStats.update({
            where: {id: playerStatId},
            data: {
                [statType]: {increment: increment ? 1 : -1},
            },
        })

        // ----------------------------------------------------------------------
        // 2) Fetch the participation & match
        // ----------------------------------------------------------------------
        const participation = await tx.playerMatchParticipation.findUnique({
            where: {id: updatedStat.playerMatchParticipationId},
            include: {
                match: true, // to get homeTeamId, awayTeamId, seasonId, status
            },
        })

        if (!participation?.match) {
            throw new Error('Participation or match not found.')
        }
        
        // Only allow stat updates for players who are playing
        if (!participation.isPlaying) {
            throw new Error('Cannot update stats for non-playing players.')
        }

        const {match} = participation
        const {homeTeamId, awayTeamId, seasonId, status} = match
        const playerId = participation.playerId

        // ----------------------------------------------------------------------
        // 2a) If points changed in an ongoing/completed match, update scoreboard
        // ----------------------------------------------------------------------
        if (statType === 'points' && (status === 'ONGOING' || status === 'COMPLETED')) {
            // figure out if the player is home or away
            const psd = await tx.playerSeasonDetails.findFirst({
                where: {
                    playerId,
                    seasonId,
                    teamId: {in: [homeTeamId, awayTeamId]},
                },
            })

            if (psd) {
                if (psd.teamId === homeTeamId) {
                    await tx.match.update({
                        where: {id: match.id},
                        data: {
                            homeScore: {increment: increment ? 1 : -1},
                        },
                    })
                } else {
                    await tx.match.update({
                        where: {id: match.id},
                        data: {
                            awayScore: {increment: increment ? 1 : -1},
                        },
                    })
                }
            }
        }

        // ----------------------------------------------------------------------
        // 2b) Check if season is practice
        // ----------------------------------------------------------------------
        const seasonRecord = await tx.season.findUnique({
            where: {id: seasonId},
            select: {isPractice: true},
        })

        // If the record is null, default to false
        const practice = seasonRecord?.isPractice ?? false

        // ----------------------------------------------------------------------
        // 3) Update season stats for points/assists/… but do NOT touch gamesPlayed here!
        // ----------------------------------------------------------------------
        await tx.playerSeasonStats.upsert({
            where: {playerId_seasonId: {playerId, seasonId}},
            create: {
                playerId,
                seasonId,
                points: statType === 'points' ? 1 : 0,
                assists: statType === 'assists' ? 1 : 0,
                rebounds: statType === 'rebounds' ? 1 : 0,
                fouls: statType === 'fouls' ? 1 : 0,
                gamesPlayed: 0, // do not increment or set here
            },
            update: {
                [statType]: {increment: increment ? 1 : -1},
            },
        })

        // ----------------------------------------------------------------------
        // 4) Only update total stats if not practice. But again, do NOT increment gamesPlayed.
        // ----------------------------------------------------------------------
        if (!practice) {
            await tx.playerTotalStats.upsert({
                where: {playerId},
                create: {
                    playerId,
                    points: statType === 'points' ? 1 : 0,
                    assists: statType === 'assists' ? 1 : 0,
                    rebounds: statType === 'rebounds' ? 1 : 0,
                    fouls: statType === 'fouls' ? 1 : 0,
                    gamesPlayed: 0, // do not increment or set here
                },
                update: {
                    [statType]: {increment: increment ? 1 : -1},
                },
            })
        }

        return updatedStat
    })
}
