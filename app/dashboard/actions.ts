'use server'

import { isAdmin } from '@/lib/rba'
import { SeasonOption } from '@/dashboard/types'
import { prisma } from '@/lib/prisma'

export async function getIsAdmin() {
    return await isAdmin()
}

export async function getAllSeasons(): Promise<SeasonOption[]> {
    // Map seasons to an array of SeasonOption (adjust formatting as needed)
    const seasons = await prisma.season.findMany({orderBy: {startDate: 'desc'},})
    return seasons.map(({name, id}) => ({name, id}))
}