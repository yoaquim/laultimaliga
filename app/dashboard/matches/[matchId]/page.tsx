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

    const date = new Date(match.date).toLocaleDateString('en-US', {month: 'long', year: 'numeric', day: 'numeric'})

    return (
        <div className="lg:mt-4 w-full p-6 mt-10 flex flex-col gap-y-8 bg-lul-black text-white overflow-y-scroll">
            {/* Match Header */}
            <div className="flex flex-col items-center justify-between gap-y-2">
                <div className="w-full flex justify-center gap-x-6 text-3xl font-bold">
                    <h1>{match.homeTeam.name}</h1>
                    <h1>⚡️</h1>
                    <h1>{match.awayTeam.name}</h1>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-lul-blue text-lg">{match.season.name}</p>
                    <h1 className="text-lg">{date}</h1>
                </div>
            </div>

            {/* Match Details */}
            <div className={clsx('relative w-full flex justify-center items-center py-2 text-center rounded-md text-lul-grey',
                {
                    'bg-lul-yellow': status === 'SCHEDULED',
                    'bg-lul-green': status === 'ONGOING',
                    'bg-lul-blue': status === 'COMPLETED',
                })}>
                <h1 className="text-2xl font-bold">{status}</h1>
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
                <h2 className="text-2xl font-semibold pt-4 bg-lul-black border-b border-lul-blue pb-2 sticky top-0 z-10">Player Stats</h2>
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
