'use server'

import { MatchStatus } from '@prisma/client'
import { StatType } from './types'
import { prisma } from '@/lib/prisma'

export async function getMatch(matchId: string) {
    return prisma.match.findUnique({
        where: {id: matchId},
        include: {
            homeTeam: true,
            awayTeam: true,
            season: true,
            participations: {
                include: {
                    player: {
                        include: {
                            user: true,
                            team: true
                        },
                    },
                    stats: true,
                },
            },
        },
    })
}

export async function updateMatchStatus(matchId: string, status: MatchStatus) {
    try {
        return await prisma.match.update({
            where: {id: matchId},
            data: {status},
        })
    } catch (error) {
        console.error('Error updating match status:', error)
        throw new Error('Failed to update match status.')
    }
}

export async function updatePlayerStat(playerStatId: string, statType: StatType, increment: boolean) {
    try {
        return await prisma.playerMatchStats.update({
            where: {id: playerStatId},
            data: {
                [statType]: {
                    increment: increment ? 1 : -1,
                },
            },
        })
    } catch (error) {
        console.error('Error updating player stat:', error)
        throw new Error('Failed to update player stat.')
    }
}
