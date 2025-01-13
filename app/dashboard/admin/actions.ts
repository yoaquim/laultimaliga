'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Size, MatchStatus } from '@prisma/client'
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
    teamId?: string;
    number: number;
}) {
    await requireAdmin()
    const newPSD = await prisma.playerSeasonDetails.create({
        data: {
            playerId: data.playerId,
            seasonId: data.seasonId,
            teamId: data.teamId || undefined,
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
    // If you want to create initial stats, add them here
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
                teamId: teamId || undefined,
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
