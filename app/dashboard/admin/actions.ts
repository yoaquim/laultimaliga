'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Size } from '@prisma/client'
import { requireAdmin } from '@/lib/rba'

// Bulk create Seasons: each row: [name, shortName, startDate, endDate]
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

// Bulk create Teams: each row: [seasonId, name, logo]
export async function bulkCreateTeamsAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [seasonId, name, logo] = row
        await prisma.team.create({
            data: {seasonId, name, logo},
        })
    }
    revalidatePath('/dashboard/admin')
}

// Bulk create Players: each row: [name, phone, size, position?]
// Note that since we dropped the phone column from Player, we only create the User and link it.
export async function bulkCreatePlayersAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        // Assume each row is: [name, phone, size, position?]
        const [name, phone, size, position] = row
        const user = await prisma.user.create({
            data: {name, phone, email: null},
        })
        await prisma.player.create({
            data: {
                userId: user.id,
                size: (size as Size) || 'MEDIUM',
                ...(position ? {position: position as any} : {}), // Cast position accordingly
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

// Bulk create Matches: each row: [homeTeamId, awayTeamId, seasonId, dateString]
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

// Bulk create PlayerSeasonDetails: each row: [playerId, seasonId, teamId, number]
export async function bulkCreatePSDetailsAction(rows: string[][]) {
    await requireAdmin()
    for (const row of rows) {
        const [playerId, seasonId, teamId, numberStr] = row
        await prisma.playerSeasonDetails.create({
            data: {
                playerId,
                seasonId,
                teamId,
                number: Number(numberStr) || 0,
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

// Bulk create PlayerMatchParticipation: each row: [playerId, matchId]
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
            // Since we dropped the phone field from Player, search using the related User's fields.
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
            totalCount = await prisma.playerMatchParticipation.count({where: wherePart})
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
