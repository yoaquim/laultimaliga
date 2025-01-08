'use server'

import { PrismaClient, MatchStatus } from '@prisma/client'
import { StatType } from '@/dashboard/matches/[matchId]/types'

const prisma = new PrismaClient()

export async function getMatch(matchId: string): Promise<any> {
    try {
        return await prisma.match.findUnique({
            where: {id: matchId},
            include: {
                homeTeam: true,
                awayTeam: true,
                playerStats: {
                    include: {
                        player: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                season: true,
            },
        })
    } catch (error) {
        console.error('Error fetching match:', error)
        throw new Error('Failed to fetch match.')
    }
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

export async function updatePlayerStat(
    playerStatId: string,
    statType: StatType,
    increment: boolean
) {
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
