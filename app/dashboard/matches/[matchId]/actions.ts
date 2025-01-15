'use server'

import { MatchStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MatchWithDetails, StatType } from './types'
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

    // return await prisma.match.findUnique({
    //     where: {id: matchId},
    //     include: {
    //         homeTeam: {
    //             include: {
    //                 players: {
    //                     include: {
    //                         player: {
    //                             include: {
    //                                 user: true,
    //                                 seasonDetails: {
    //                                     where: {
    //                                         seasonId
    //                                     }
    //                                 }
    //                             },
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //         awayTeam: {
    //             include: {
    //                 players: {
    //                     include: {
    //                         player: {
    //                             include: {
    //                                 user: true,
    //                                 seasonDetails: {
    //                                     where: {
    //                                         seasonId
    //                                     }
    //                                 }
    //                             },
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //         season: true,
    //         participations: {
    //             include: {
    //                 player: {
    //                     include: {
    //                         user: true,
    //                     },
    //                 },
    //                 stats: true, // includes "points, assists, rebounds"
    //             },
    //         },
    //     },
    // })
}

/**
 * Updates match status. If new status is COMPLETED, we finalize the match:
 *   - increment `gamesPlayed` in `PlayerTotalStats` for each participant
 *   - increment `gamesPlayed` in `SeasonStats` for each participant in that season
 */
export async function updateMatchStatus(matchId: string, status: MatchStatus) {
    await requireAdmin()
    return prisma.$transaction(
        async (tx) => {
            // 1) Update the match
            const updatedMatch = await tx.match.update({
                where: {id: matchId},
                data: {status},
                include: {season: true},
            })

            // 2) If COMPLETED => finalize gamesPlayed
            if (status === 'COMPLETED') {
                const participants = await tx.playerMatchParticipation.findMany({
                    where: {matchId},
                })

                for (const p of participants) {
                    const playerId = p.playerId

                    // update total stats
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
                            },
                            update: {
                                gamesPlayed: {increment: 1},
                            },
                        })
                    }
                }
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
export async function updatePlayerStat(playerStatId: string, statType: StatType, increment: boolean) {
    await requireAdmin()
    return prisma.$transaction(async (tx) => {
        // 1) Update PlayerMatchStats (the individual's stat row for that match)
        const updatedStat = await tx.playerMatchStats.update({
            where: {id: playerStatId},
            data: {
                [statType]: {increment: increment ? 1 : -1},
            },
        })

        // 2) Fetch the participation & match
        const participation = await tx.playerMatchParticipation.findUnique({
            where: {id: updatedStat.playerMatchParticipationId},
            include: {
                match: true, // to get homeTeamId, awayTeamId, seasonId, status
            },
        })

        if (!participation?.match) {
            throw new Error('Participation or match not found.')
        }

        const match = participation.match
        const {homeTeamId, awayTeamId, seasonId, status} = match

        // 2a) If points changed and match is ongoing/completed, update scoreboard
        if (statType === 'points' && (status === 'ONGOING' || status === 'COMPLETED')) {
            // figure out if the player is home or away
            const psd = await tx.playerSeasonDetails.findFirst({
                where: {
                    playerId: participation.playerId,
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

        // 3) Update PlayerTotalStats
        // We'll recalc `gamesPlayed` each time by counting all match participations
        const playerId = participation.playerId

        // Count how many total matches the player has participated in (any season)
        const totalGames = await tx.playerMatchParticipation.count({
            where: {playerId},
        })

        // Upsert PlayerTotalStats
        await tx.playerTotalStats.upsert({
            where: {playerId},
            create: {
                playerId,
                points: statType === 'points' ? 1 : 0,
                assists: statType === 'assists' ? 1 : 0,
                rebounds: statType === 'rebounds' ? 1 : 0,
                gamesPlayed: totalGames, // newly counted
            },
            update: {
                [statType]: {
                    increment: increment ? 1 : -1,
                },
                gamesPlayed: totalGames,
            },
        })

        // 4) Update SeasonStats for the *current* season
        // We'll also recalc how many matches the player participated in that season
        const seasonGames = await tx.playerMatchParticipation.count({
            where: {
                playerId,
                match: {
                    seasonId,
                },
            },
        })

        await tx.playerSeasonStats.upsert({
            where: {
                playerId_seasonId: {playerId, seasonId},
            },
            create: {
                playerId,
                seasonId,
                points: statType === 'points' ? 1 : 0,
                assists: statType === 'assists' ? 1 : 0,
                rebounds: statType === 'rebounds' ? 1 : 0,
                gamesPlayed: seasonGames,
            },
            update: {
                [statType]: {
                    increment: increment ? 1 : -1,
                },
                gamesPlayed: seasonGames,
            },
        })

        return updatedStat
    })
}
