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
        const [name, phone, size, position, seasonId, teamId, number] = row

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
                size: (size as Size) || 'MEDIUM',
                ...(position ? {position: position as any} : {}),
            },
        })

        // 3) Create PlayerSeasonDetails
        const psDetails = await prisma.playerSeasonDetails.create({
            data: {
                playerId: player.id,
                seasonId,
                teamId,
                number
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
 * Bulk create Matches: each row: [homeTeamId, awayTeamId, seasonId, dateString]
 * Returns an array of created match objects.
 */
export async function bulkCreateMatchesAction(rows: string[][]) {
    await requireAdmin()
    const created = []
    for (const row of rows) {
        const [homeTeamId, awayTeamId, seasonId, dateStr] = row
        const match = await prisma.match.create({
            data: {
                homeTeamId,
                awayTeamId,
                seasonId,
                date: new Date(dateStr),
            },
        })
        created.push(match)
    }
    revalidatePath('/dashboard/admin')
    return created
}

/**
 * Bulk create PlayerMatchParticipation: each row: [playerId, matchId]
 * Returns an array of created participation objects.
 */
export async function bulkCreateParticipationsAction(rows: string[][]) {
    await requireAdmin()
    const created = []
    for (const row of rows) {
        const [playerId, matchId] = row
        const participation = await prisma.playerMatchParticipation.create({
            data: {
                playerId,
                matchId,
            },
        })
        created.push(participation)
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
