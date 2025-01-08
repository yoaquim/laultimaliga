'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MatchStatus } from '@prisma/client'
import { MatchWithDetails, StatType } from './types'
import { getMatch, updateMatchStatus, updatePlayerStat } from './actions'
import clsx from 'clsx'

export default function Page() {
    const {matchId} = useParams<{ matchId: string }>()
    const [loading, setLoading] = useState<boolean>(true)
    const [match, setMatch] = useState<MatchWithDetails | null>(null)
    const [status, setStatus] = useState<MatchStatus | null>(null)

    useEffect(() => {
        async function fetchMatch() {
            const fetchedMatch = await getMatch(matchId) as MatchWithDetails
            setMatch(fetchedMatch)
            setStatus(fetchedMatch?.status || null)
            setLoading(false)
        }

        fetchMatch()
    }, [matchId])


    const handleStatusChange = async (newStatus: MatchStatus) => {
        try {
            await updateMatchStatus(matchId, newStatus)
            setStatus(newStatus)
        } catch (error) {
            console.error('Error updating match status:', error)
        }
    }

    const handleUpdateStats = async (playerStatId: string, statType: StatType, increment: boolean) => {
        try {
            const updatedStat = await updatePlayerStat(playerStatId, statType, increment)
            setMatch((prev: any) => ({
                ...prev,
                playerStats: prev.playerStats.map((stat: any) =>
                    stat.id === playerStatId ? {...stat, [statType]: updatedStat[statType]} : stat
                ),
            }))
        } catch (error) {
            console.error('Error updating player stats:', error)
        }
    }

    if (loading) return <div>Loading...</div>

    if (!match) return <div>Match not found</div>

    return (
        <div className="lg:mt-4 w-full p-6 mt-10 flex flex-col gap-y-8 bg-lul-black text-white overflow-y-scroll">
            {/* Match Header */}
            <div className="flex flex-col lg:flex-row items-center justify-between">
                <h1 className="text-3xl font-bold">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                </h1>
                <p className="text-lul-blue text-lg">{match.season.name}</p>
            </div>

            {/* Match Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-lul-grey/20 p-4 rounded-md">
                <div className="flex flex-col items-center">
                    <p className="text-lg">Status</p>
                    <p className="text-2xl font-bold">{status}</p>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-lg">Date</p>
                    <p className="text-2xl font-bold">{new Date(match.date).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Update Match Status */}
            <div className="flex gap-4">
                <button
                    onClick={() => handleStatusChange('ONGOING')}
                    className={`py-2 px-4 bg-lul-blue text-white rounded-md ${status === 'ONGOING' ? 'opacity-50' : ''}`}
                    disabled={status === 'ONGOING'}
                >
                    Start Match
                </button>
                <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    className={`py-2 px-4 bg-lul-green text-white rounded-md ${status === 'COMPLETED' ? 'opacity-50' : ''}`}
                    disabled={status === 'COMPLETED'}
                >
                    Complete Match
                </button>
            </div>

            {/* Player Stats */}
            <div className="w-full h-fit p-4 pt-0 rounded-md overflow-y-scroll border border-lul-blue">
                <h2 className="text-2xl font-semibold pt-4 bg-lul-black border-b border-lul-blue pb-2 sticky top-0">Player Stats</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    {match.playerStats.map((playerStat: any) => (
                        <div key={playerStat.id} className="p-4 bg-lul-light-grey/10 rounded-md">
                            <h3 className="text-2xl font-bold">{playerStat.player.user.name}</h3>
                            <div className="w-full mt-4 flex justify-between gap-2">
                                {['points', 'assists', 'rebounds'].map((stat) => (
                                    <div key={stat} className="flex flex-col items-center text-2xl gap-y-4">

                                        <div className="flex flex-col items-center">
                                            <div className="uppercase text-xs antialiased">{stat}</div>
                                            <div className="font-bold">{playerStat[stat]}</div>
                                        </div>

                                        <button
                                            disabled={status !== 'ONGOING'}
                                            className={clsx('px-4 rounded-md text-white mt-1 bg-lul-green', {
                                                'opacity-30': status !== 'ONGOING',
                                            })}
                                            onClick={() => handleUpdateStats(playerStat.id, stat as StatType, true)}
                                        >
                                            +
                                        </button>
                                        <button
                                            disabled={status !== 'ONGOING'}
                                            className={clsx('px-5 rounded-md text-white mt-1 bg-lul-red', {
                                                'opacity-30': status !== 'ONGOING',
                                            })}
                                            onClick={() => handleUpdateStats(playerStat.id, stat as StatType, false)}
                                        >
                                            -
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
