'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Size } from '@prisma/client'
import { requireAdmin } from '@/lib/rba'
import { standardizePhoneNumber } from '@/lib/utils'

/**
 * Bulk create Seasons: each row: [name, shortName, startDate, endDate]
 * Returns an array of created season objects.
 */
export async function bulkCreateSeasonsAction(rows: string[][]) {
    await requireAdmin()
    const created = []
    for (const row of rows) {
        const [name, shortName, start, end] = row
        console.log(`Creating new season: ${name}, ${shortName}, ${start},${end}`)
        const season = await prisma.season.create({
            data: {
                name,
                shortName: shortName || null,
                startDate: new Date(start),
                endDate: new Date(end),
            },
        })
        created.push(season)
    }
    revalidatePath('/dashboard/admin')
    return created
}

/**
 * Bulk create Teams: each row: [seasonId, name, logo]
 * Returns an array of created team objects.
 */
export async function bulkCreateTeamsAction(rows: string[][]) {
    await requireAdmin()
    const created = []
    for (const row of rows) {
        const [seasonId, name, logo] = row
        const team = await prisma.team.create({
            data: {seasonId, name, logo},
        })
        created.push(team)
    }
    revalidatePath('/dashboard/admin')
    return created
}

/**
 * Bulk create Players in a single flow:
 *   CSV row: [name, phone, size, position, seasonId, teamId, number]
 *
 *   1) Create a dummy User (email = null) with `name` and `phone`.
 *   2) Create Player with userId, size, position.
 *   3) Create PlayerSeasonDetails (playerId, seasonId, teamId, number).
 *
 * Returns an array of objects:
 *   { userId, playerId, psDetailsId }
 */
export async function bulkCreatePlayersAction(rows: string[][]) {
    await requireAdmin()
    const created = []
    for (const row of rows) {
        const [name, phone, shirtSize, pantsSize, position, seasonId, teamId, number, isCaptain] = row

        // 1) Create user
        const user = await prisma.user.create({
            data: {
                name,
                phone: standardizePhoneNumber(phone),
                email: null, // dummy email
            },
        })

        // 2) Create player
        const player = await prisma.player.create({
            data: {
                userId: user.id,
                shirtSize: shirtSize === 'null' ? null : shirtSize as Size,
                pantsSize: pantsSize === 'null' ? null : pantsSize as Size,
                ...(position ? {position: position as any} : {}),
            },
        })

        // 3) Create PlayerSeasonDetails
        const psDetails = await prisma.playerSeasonDetails.create({
            data: {
                playerId: player.id,
                seasonId,
                teamId,
                number,
                isCaptain: isCaptain === 'true',
            },
        })

        created.push({
            userId: user.id,
            playerId: player.id,
            psDetailsId: psDetails.id,
        })
    }
    revalidatePath('/dashboard/admin')
    return created
}

/**
 * Generic data fetch for the DataView panel.
 * This version does case‑sensitive searches.
 */
export async function fetchTableDataAction(params: {
    table: string;
    page: number;
    pageSize: number;
    search?: string;
}) {
    await requireAdmin()

    const {table, page, pageSize, search} = params
    const skip = (page - 1) * pageSize

    let items: any[] = []
    let totalCount = 0

    switch (table) {
        case 'SEASON': {
            const whereSeason = search
                ? {
                    OR: [
                        {name: {contains: search}},
                        {shortName: {contains: search}},
                    ],
                }
                : {}
            totalCount = await prisma.season.count({where: whereSeason})
            items = await prisma.season.findMany({
                where: whereSeason,
                skip,
                take: pageSize,
                orderBy: {createdAt: 'desc'},
            })
            break
        }

        case 'TEAM': {
            const whereTeam = search ? {name: {contains: search}} : {}
            totalCount = await prisma.team.count({where: whereTeam})
            items = await prisma.team.findMany({
                where: whereTeam,
                skip,
                take: pageSize,
                orderBy: {createdAt: 'desc'},
            })
            break
        }

        case 'PLAYER': {
            // Search by user name or phone
            const wherePlayer = search
                ? {
                    OR: [
                        {user: {name: {contains: search}}},
                        {user: {phone: {contains: search}}},
                    ],
                }
                : {}
            totalCount = await prisma.player.count({where: wherePlayer})
            items = await prisma.player.findMany({
                where: wherePlayer,
                skip,
                take: pageSize,
                orderBy: {createdAt: 'desc'},
                include: {
                    user: {select: {name: true, phone: true, email: true}},
                },
            })
            break
        }

        case 'MATCH': {
            const whereMatch = search ? {id: {contains: search}} : {}
            totalCount = await prisma.match.count({where: whereMatch})
            items = await prisma.match.findMany({
                where: whereMatch,
                skip,
                take: pageSize,
                orderBy: {createdAt: 'desc'},
            })
            break
        }

        case 'PARTICIPATION': {
            // PlayerMatchParticipation
            const wherePart = search
                ? {
                    OR: [
                        {playerId: {contains: search}},
                        {matchId: {contains: search}},
                    ],
                }
                : {}
            totalCount = await prisma.playerMatchParticipation.count({
                where: wherePart,
            })
            items = await prisma.playerMatchParticipation.findMany({
                where: wherePart,
                skip,
                take: pageSize,
                orderBy: {createdAt: 'desc'},
            })
            break
        }

        default:
            break
    }

    return {items, totalCount}
}

/**
 * Generate a round-robin schedule of Matches for the selected Season,
 * with each Team playing exactly one match against every other Team.
 * Also automatically creates PlayerMatchParticipation + stats=0
 * for all players on those teams.
 */
export async function generateRoundRobinMatches(seasonId: string) {
    await requireAdmin()

    // 1) Get all teams in this season
    const teams = await prisma.team.findMany({
        where: {seasonId},
        include: {
            // Need the seasonDetails to find the Player IDs
            players: {
                include: {
                    player: true
                }
            }
        }
    })

    // Early exit if < 2 teams
    if (teams.length < 2) {
        return {
            createdMatches: 0,
            createdParticipations: 0,
            msg: 'Not enough teams in this Season to create matches.',
        }
    }

    let createdMatches = 0
    let createdParticipations = 0

    // 2) For each unique pair of teams
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const teamA = teams[i]
            const teamB = teams[j]

            // 2a) Create a match
            const match = await prisma.match.create({
                data: {
                    homeTeamId: teamA.id,
                    awayTeamId: teamB.id,
                    seasonId,
                    // you can assign any date or status if needed
                    date: new Date(),
                    status: 'SCHEDULED'
                }
            })
            createdMatches++

            // 2b) For each team, create participations for ALL players on that team
            const twoTeamsPlayers = [teamA.players, teamB.players]
            for (const psDetailsArr of twoTeamsPlayers) {
                for (const psDetails of psDetailsArr) {
                    const playerId = psDetails.playerId
                    // create participation + stats=0
                    await prisma.playerMatchParticipation.create({
                        data: {
                            playerId,
                            matchId: match.id,
                            stats: {
                                create: {
                                    points: 0,
                                    assists: 0,
                                    rebounds: 0,
                                    fouls: 0,
                                }
                            }
                        }
                    })
                    createdParticipations++
                }
            }
        }
    }

    revalidatePath('/dashboard/admin')
    return {
        createdMatches,
        createdParticipations,
        msg: `Created ${createdMatches} matches and ${createdParticipations} participations.`
    }
}

/**
 * Bulk create Matches (CSV: [homeTeamId, awayTeamId, seasonId, dateString])
 * and also create PlayerMatchParticipation + stats=0 for all players in both teams.
 *
 * Returns array of created matches.
 */
export async function bulkCreateMatchesWithParticipationsAction(rows: string[][]) {
    await requireAdmin()
    const created = []

    for (const row of rows) {
        const [homeTeamId, awayTeamId, seasonId, dateStr] = row

        // 1) Create the match
        const match = await prisma.match.create({
            data: {
                homeTeamId,
                awayTeamId,
                seasonId,
                date: new Date(dateStr),
                status: 'SCHEDULED',
            },
        })

        // 2) Load both teams (including their players)
        const teams = await prisma.team.findMany({
            where: {
                id: {in: [homeTeamId, awayTeamId]},
            },
            include: {
                players: {
                    include: {player: true}
                }
            }
        })

        // 3) For each team’s players, create participation + stats=0
        for (const t of teams) {
            for (const psDetails of t.players) {
                await prisma.playerMatchParticipation.create({
                    data: {
                        playerId: psDetails.playerId,
                        matchId: match.id,
                        stats: {
                            create: {
                                points: 0,
                                assists: 0,
                                rebounds: 0,
                                fouls: 0,
                            },
                        },
                    },
                })
            }
        }

        created.push(match)
    }

    revalidatePath('/dashboard/admin')
    return created
}
