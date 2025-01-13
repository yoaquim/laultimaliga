'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Size } from '@prisma/client'

/** Create a single Season */
export async function createSeasonAction(data: {
    name: string;
    shortName?: string;
    startDate: string;
    endDate: string;
}) {
    const {name, shortName, startDate, endDate} = data
    await prisma.season.create({
        data: {
            name,
            shortName: shortName || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        },
    })
    // Optionally revalidate
    revalidatePath('/dashboard/admin')
}

/** Create a single Team */
export async function createTeamAction(data: { name: string; seasonId: string }) {
    const {name, seasonId} = data
    await prisma.team.create({
        data: {
            name,
            seasonId,
        },
    })
    revalidatePath('/dashboard/admin')
}

/** Create a single Player */
export async function createPlayerAction(data: { name: string; phone: string; size: string }) {
    // We will create a user row with email = null => "unclaimed" user
    // Then create a Player referencing that user
    const {name, phone, size} = data
    // For demonstration, assume 'user.name' = name, 'user.phone' = phone
    const user = await prisma.user.create({
        data: {
            name,
            phone,
            email: null, // unclaimed
        },
    })
    await prisma.player.create({
        data: {
            userId: user.id,
            phone,
            size: size as Size,
        },
    })
    revalidatePath('/dashboard/admin')
}

/** Create a single Match */
export async function createMatchAction(data: {
    homeTeamId: string;
    awayTeamId: string;
    seasonId: string;
    date: string;
}) {
    const {homeTeamId, awayTeamId, seasonId, date} = data
    await prisma.match.create({
        data: {
            homeTeamId,
            awayTeamId,
            seasonId,
            date: new Date(date),
        },
    })
    revalidatePath('/dashboard/admin')
}

/** Bulk: parse the array of string[] from CSV */
export async function bulkCreateSeasonsAction(rows: string[][]) {
    // Each row might be: [name, shortName, startDate, endDate]
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

export async function bulkCreateTeamsAction(rows: string[][]) {
    // Each row might be: [teamName, seasonId]
    for (const row of rows) {
        const [name, seasonId] = row
        await prisma.team.create({
            data: {
                name,
                seasonId,
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

export async function bulkCreatePlayersAction(rows: string[][]) {
    // Each row might be: [name, phone, size]
    // We create a user with email=null => unclaimed, then a Player
    for (const row of rows) {
        const [name, phone, size] = row
        const user = await prisma.user.create({
            data: {
                name,
                phone,
                email: null,
            },
        })
        await prisma.player.create({
            data: {
                userId: user.id,
                phone,
                size: size as Size || 'MEDIUM',
            },
        })
    }
    revalidatePath('/dashboard/admin')
}

export async function bulkCreateMatchesAction(rows: string[][]) {
    // Each row might be: [homeTeamId, awayTeamId, seasonId, dateString]
    for (const row of rows) {
        const [homeTeamId, awayTeamId, seasonId, dateString] = row
        await prisma.match.create({
            data: {
                homeTeamId,
                awayTeamId,
                seasonId,
                date: new Date(dateString),
            },
        })
    }
    revalidatePath('/dashboard/admin')
}
