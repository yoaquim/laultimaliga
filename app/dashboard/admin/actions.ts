'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Size } from '@prisma/client'
import { requireAdmin } from '@/lib/rba'

/** Create a single Season */
export async function createSeasonAction(data: {
    name: string;
    shortName?: string;
    startDate: string;
    endDate: string;
}) {
    await requireAdmin()
    const newSeason = await prisma.season.create({
        data: {
            name: data.name,
            shortName: data.shortName || null,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
        },
    })
    revalidatePath('/dashboard/admin')
    return newSeason
}

/** Create a single Team */
export async function createTeamAction(data: { name: string; seasonId: string }) {
    await requireAdmin()
    const newTeam = await prisma.team.create({
        data: {
            name: data.name,
            seasonId: data.seasonId,
        },
    })
    revalidatePath('/dashboard/admin')
    return newTeam
}

/** Create a single Player */
export async function createPlayerAction(data: { name: string; phone: string; size: string }) {
    await requireAdmin()
    const user = await prisma.user.create({
        data: {
            name: data.name,
            phone: data.phone,
            email: null,
        },
    })
    const newPlayer = await prisma.player.create({
        data: {
            userId: user.id,
            phone: data.phone,
            size: data.size as Size,
        },
    })
    revalidatePath('/dashboard/admin')
    return newPlayer
}

/** Create a single Match */
export async function createMatchAction(data: {
    homeTeamId: string;
    awayTeamId: string;
    seasonId: string;
    date: string;
}) {
    await requireAdmin()
    const newMatch = await prisma.match.create({
        data: {
            homeTeamId: data.homeTeamId,
            awayTeamId: data.awayTeamId,
            seasonId: data.seasonId,
            date: new Date(data.date),
        },
    })
    revalidatePath('/dashboard/admin')
    return newMatch
}

/** Create a single PlayerSeasonDetails */
export async function createPSDetailsAction(data: {
    playerId: string;
    seasonId: string;
    teamId: string;
    number: number;
}) {
    await requireAdmin()
    const newPSD = await prisma.playerSeasonDetails.create({
        data: {
            playerId: data.playerId,
            seasonId: data.seasonId,
            teamId: data.teamId,
            number: data.number,
        },
    })
    revalidatePath('/dashboard/admin')
    return newPSD
}

/** Create a single PlayerMatchParticipation */
export async function createParticipationAction(data: {
    playerId: string;
    matchId: string;
}) {
    await requireAdmin()
    const newParticipation = await prisma.playerMatchParticipation.create({
        data: {
            playerId: data.playerId,
            matchId: data.matchId,
        },
    })
    revalidatePath('/dashboard/admin')
    return newParticipation
}

/** Bulk Creation */

// Seasons: [name, shortName, startDate, endDate]
export async function bulkCreateSeasonsAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [name, shortName, start, end] = row
        await prisma.season.create({
            data: {
                name,
                shortName: shortName || null,
                startDate: new Date(start),
                endDate: new Date(end),
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

// Teams: [name, seasonId]
export async function bulkCreateTeamsAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [name, seasonId] = row
        await prisma.team.create({data: {name, seasonId}})
    }
    revalidatePath('/dashboard/admin')
}

// Players: [name, phone, size]
export async function bulkCreatePlayersAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [name, phone, size] = row
        const user = await prisma.user.create({
            data: {name, phone, email: null},
        })
        await prisma.player.create({
            data: {
                userId: user.id,
                phone,
                size: (size as Size) || 'MEDIUM',
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

// Matches: [homeTeamId, awayTeamId, seasonId, dateString]
export async function bulkCreateMatchesAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [homeTeamId, awayTeamId, seasonId, dateStr] = row
        await prisma.match.create({
            data: {
                homeTeamId,
                awayTeamId,
                seasonId,
                date: new Date(dateStr),
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

// PlayerSeasonDetails: [playerId, seasonId, teamId, number]
export async function bulkCreatePSDetailsAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [playerId, seasonId, teamId, numberStr] = row
        await prisma.playerSeasonDetails.create({
            data: {
                playerId,
                seasonId,
                teamId: teamId,
                number: Number(numberStr) || 0,
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

// PlayerMatchParticipation: [playerId, matchId]
export async function bulkCreateParticipationsAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [playerId, matchId] = row
        await prisma.playerMatchParticipation.create({
            data: {
                playerId,
                matchId,
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

/**
 * Generic data fetch for your DataView panel
 * This version does NOT use QueryMode to avoid TS errors, so searches are case-sensitive.
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
            // case-sensitive search
            const whereSeason = search
                ? {
                    OR: [
                        {
                            name: {
                                contains: search,
                            },
                        },
                        {
                            shortName: {
                                contains: search,
                            },
                        },
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
            const whereTeam = search
                ? {
                    name: {contains: search},
                }
                : {}

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
            // phone is optional, so we treat as string | null
            // We'll do "contains: search" case-sensitive
            const wherePlayer = search
                ? {
                    OR: [
                        {
                            phone: {contains: search},
                        },
                        // could also search user.name if we want,
                        // e.g. { user: { name: { contains: search } } }
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
                    user: {select: {name: true}},
                },
            })
            break
        }

        case 'MATCH': {
            const whereMatch = search
                ? {
                    id: {contains: search},
                }
                : {}
            totalCount = await prisma.match.count({where: whereMatch})
            items = await prisma.match.findMany({
                where: whereMatch,
                skip,
                take: pageSize,
                orderBy: {createdAt: 'desc'},
            })
            break
        }

        case 'PSDETAILS': {
            // PlayerSeasonDetails
            const wherePSD = search
                ? {
                    OR: [
                        {playerId: {contains: search}},
                        {teamId: {contains: search}},
                        {seasonId: {contains: search}},
                    ],
                }
                : {}
            totalCount = await prisma.playerSeasonDetails.count({where: wherePSD})
            items = await prisma.playerSeasonDetails.findMany({
                where: wherePSD,
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
            // no action
            break
    }

    return {items, totalCount}
}
