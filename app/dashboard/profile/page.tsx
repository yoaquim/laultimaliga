'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import Shimmer from '@/ui/shimmer'
import Link from 'next/link'
import { fetchUserProfile } from './actions'

export default function Page() {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        async function loadProfile() {
            const data = await fetchUserProfile()
            setProfile(data)
            setLoading(false)
        }

        loadProfile()
    }, [])

    if (loading) {
        return (
            <div className="relative w-full h-full flex flex-col justify-center items-center">
                <div className="lg:w-1/3 w-5/6 h-2">
                    <Shimmer/>
                </div>
            </div>
        )
    }

    if (!profile || !profile.sessionUser) {
        return <Empty message={EMPTY_MESSAGES.NO_PLAYERS}/>
    }

    const {sessionUser, unclaimedPlayer} = profile
    const {Player} = sessionUser

    return (
        <div className="w-full h-full flex flex-col text-white gap-y-8 py-6 px-4">
            {/* Header: Basic user info */}
            <div className="flex flex-col items-center gap-y-2">
                <h1 className="text-4xl font-bold">{sessionUser.name}</h1>
                <p className="text-lul-blue uppercase font-semibold tracking-wide text-sm">
                    User Profile
                </p>
                <div className="mt-2 text-lul-light-grey text-sm flex flex-col items-center">
                    {/* If email is not null, show it */}
                    {sessionUser.email && (
                        <p>
                            <span className="font-bold text-lul-orange mr-2">Email:</span>
                            {sessionUser.email}
                        </p>
                    )}
                    {sessionUser.phone && (
                        <p>
                            <span className="font-bold text-lul-orange mr-2">Phone:</span>
                            {sessionUser.phone}
                        </p>
                    )}
                    {sessionUser.role && (
                        <p className="uppercase text-xs">
                            Role: {sessionUser.role}
                        </p>
                    )}
                </div>
            </div>

            {/* Content Depending on Player or Not */}
            {!Player ? (
                // The user is NOT a player
                <div className="flex flex-col gap-y-4 items-center mt-4">
                    <p className="text-sm text-lul-red">
                        You do not currently have a player profile linked.
                    </p>

                    {unclaimedPlayer ? (
                        <div className="bg-lul-grey/20 rounded-md p-4 text-center w-full max-w-md">
                            <h2 className="text-lul-yellow font-bold text-xl mb-2">
                                Claim Your Player Profile!
                            </h2>
                            <p className="text-sm text-lul-light-grey mb-4">
                                We found a matching unclaimed player record with the same phone number.
                                You can claim it and start tracking your stats.
                            </p>
                            <Link
                                href={`/dashboard/players/claim?playerId=${unclaimedPlayer.id}`}
                                className="px-4 py-2 bg-lul-green rounded-md text-white font-semibold hover:bg-lul-dark-grey transition-colors"
                            >
                                Claim Player Profile
                            </Link>
                        </div>
                    ) : (
                        <p className="text-xs text-lul-light-grey mt-2">
                            No matching unclaimed players found by your phone number.
                        </p>
                    )}
                </div>
            ) : (
                // The user is a Player => show stats, upcoming matches, etc.
                <div className="flex flex-col gap-y-6">
                    {/* Stats Section */}
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Total Stats */}
                        <div className="flex-1 bg-lul-grey/20 rounded-md p-4">
                            <h2 className="text-center text-xl font-bold uppercase text-lul-yellow">
                                Total Stats
                            </h2>
                            <div className="grid grid-cols-2 gap-4 text-center mt-4">
                                <div>
                                    <p className="text-lul-blue font-semibold text-xs uppercase">Points</p>
                                    <p className="text-lul-green text-3xl font-bold">
                                        {Player.totalStats?.points || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lul-blue font-semibold text-xs uppercase">Assists</p>
                                    <p className="text-lul-green text-3xl font-bold">
                                        {Player.totalStats?.assists || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lul-blue font-semibold text-xs uppercase">Rebounds</p>
                                    <p className="text-lul-green text-3xl font-bold">
                                        {Player.totalStats?.rebounds || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lul-blue font-semibold text-xs uppercase">Games</p>
                                    <p className="text-lul-green text-3xl font-bold">
                                        {Player.totalStats?.gamesPlayed || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Current Season Stats */}
                        <div className="flex-1 bg-lul-grey/20 rounded-md p-4">
                            <h2 className="text-center text-xl font-bold uppercase text-lul-yellow">
                                Current Season
                            </h2>
                            {Player.SeasonStats && Player.SeasonStats.length > 0 ? (
                                (() => {
                                    const activeStats = Player.SeasonStats.find(
                                        (st: any) => st.season.isActive === true
                                    )
                                    if (!activeStats) {
                                        return (
                                            <p className="text-center text-sm text-lul-light-grey mt-2">
                                                No Active Season Stats found.
                                            </p>
                                        )
                                    }
                                    return (
                                        <div className="grid grid-cols-2 gap-4 text-center mt-4">
                                            <div>
                                                <p className="text-lul-blue font-semibold text-xs uppercase">
                                                    Points
                                                </p>
                                                <p className="text-lul-green text-3xl font-bold">
                                                    {activeStats.points}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-lul-blue font-semibold text-xs uppercase">
                                                    Assists
                                                </p>
                                                <p className="text-lul-green text-3xl font-bold">
                                                    {activeStats.assists}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-lul-blue font-semibold text-xs uppercase">
                                                    Rebounds
                                                </p>
                                                <p className="text-lul-green text-3xl font-bold">
                                                    {activeStats.rebounds}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-lul-blue font-semibold text-xs uppercase">
                                                    Games
                                                </p>
                                                <p className="text-lul-green text-3xl font-bold">
                                                    {activeStats.gamesPlayed}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })()
                            ) : (
                                <p className="text-center text-sm text-lul-light-grey mt-2">
                                    No Season Stats found
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Matches / Match List */}
                    <div className="bg-lul-grey/20 rounded-md p-4 flex flex-col gap-y-2 h-64">
                        <h2 className="text-xl font-bold uppercase text-lul-yellow">
                            Upcoming Matches
                        </h2>
                        <div className="overflow-y-auto flex-1">
                            {Player.participations.length === 0 ? (
                                <p className="text-center text-lul-light-grey">
                                    No matches found for this player.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-y-3">
                                    {Player.participations
                                        .map((p: any) => p.match)
                                        .sort((a: any, b: any) =>
                                            new Date(a.date).getTime() - new Date(b.date).getTime()
                                        )
                                        .map((m: any) => {
                                            const dateStr = new Date(m.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })
                                            return (
                                                <li
                                                    key={m.id}
                                                    className="bg-lul-black/20 p-3 rounded-md flex flex-col
                                     sm:flex-row sm:justify-between sm:items-center gap-y-2"
                                                >
                                                    <div>
                            <span className="text-sm font-bold text-lul-green mr-2">
                              {m.homeScore} - {m.awayScore}
                            </span>
                                                        <span className="text-xs text-lul-light-grey">
                              {m.season.name}
                            </span>
                                                    </div>
                                                    <div>
                            <span
                                className={clsx(
                                    'text-xs uppercase font-semibold',
                                    {
                                        'text-lul-yellow': m.status === 'SCHEDULED',
                                        'text-lul-green': m.status === 'ONGOING',
                                        'text-lul-blue': m.status === 'COMPLETED',
                                        'text-lul-red': m.status === 'CANCELED',
                                    }
                                )}
                            >
                              {m.status}
                            </span>
                                                        <span className="ml-3 text-xs text-lul-light-grey">
                              {dateStr}
                            </span>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
