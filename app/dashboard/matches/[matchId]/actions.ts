'use server'

import { MatchStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { StatType } from './types'

/**
 * Fetches match details + included data so the client can render everything.
 */
export async function getMatch(matchId: string) {
    console.log(`Fetching match with ID: ${matchId}`)

    return await prisma.match.findUnique({
        where: {id: matchId},
        include: {
            homeTeam: {
                include: {
                    players: {
                        include: {
                            player: {
                                include: {
                                    user: true,
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
                        include: {
                            user: true,
                        },
                    },
                    stats: true, // includes "points, assists, rebounds"
                },
            },
        },
    })
}

/**
 * Updates match status. If new status is COMPLETED, we finalize the match:
 *   - increment `gamesPlayed` in `PlayerTotalStats` for each participant
 *   - increment `gamesPlayed` in `SeasonStats` for each participant in that season
 */
export async function updateMatchStatus(matchId: string, status: MatchStatus) {
    console.log(`Updating match #${matchId} to status: ${status}`)

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
                        await tx.seasonStats.upsert({
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
 * plus update their totalStats & seasonStats, WITHOUT recalculating gamesPlayed every time.
 * We wrap it in a single transaction for speed.
 */
export async function updatePlayerStat(playerStatId: string, statType: StatType, increment: boolean) {
    return prisma.$transaction(async (tx) => {
        // 1) Update the player's individual stat
        const updatedStat = await tx.playerMatchStats.update({
            where: {id: playerStatId},
            data: {
                [statType]: {
                    increment: increment ? 1 : -1,
                },
            },
        })

        // 2) Find participation to see which match & which team
        const participation = await tx.playerMatchParticipation.findUnique({
            where: {id: updatedStat.playerMatchParticipationId},
            include: {
                match: true, // so we can get homeTeamId, awayTeamId, status, etc.
            },
        })

        if (!participation?.match) {
            throw new Error('Participation or match not found')
        }

        const match = participation.match
        const {homeTeamId, awayTeamId, seasonId, status} = match

        // If they changed "points", also update scoreboard if match is ongoing (or completed, if you like)
        if (statType === 'points' && (status === 'ONGOING' || status === 'COMPLETED')) {
            // figure out if the player is on the home team or away team
            // We'll look up the player's `PlayerSeasonDetails` to see if teamId = homeTeamId or awayTeamId
            const psd = await tx.playerSeasonDetails.findFirst({
                where: {
                    playerId: participation.playerId,
                    seasonId,
                    teamId: {in: [homeTeamId, awayTeamId]},
                },
            })

            if (!psd) {
                // Not found or not on home/away team—should not happen if data is correct
                console.warn('Player not found on either home/away team for this match.')
            } else {
                // If the player's PSD matches the homeTeamId, increment homeScore, else increment awayScore
                const isHomeTeam = psd.teamId === homeTeamId

                if (isHomeTeam) {
                    await tx.match.update({
                        where: {id: match.id},
                        data: {
                            homeScore: {
                                increment: increment ? 1 : -1,
                            },
                        },
                    })
                } else {
                    await tx.match.update({
                        where: {id: match.id},
                        data: {
                            awayScore: {
                                increment: increment ? 1 : -1,
                            },
                        },
                    })
                }
            }
        }

        // 3) Update PlayerTotalStats & SeasonStats (your existing logic)
        // (Example short snippet)
        const playerId = participation.playerId

        // Update total or season stats, skipping the details for brevity...
        // ... your existing upsert logic goes here ...

        return updatedStat
    })
}
