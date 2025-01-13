'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useParams } from 'next/navigation'
import { MatchStatus } from '@prisma/client'
import MessageModal from '@/ui/message-modal'
import { MatchWithDetails, StatType } from './types'
import { getMatch, updateMatchStatus, updatePlayerStat } from './actions'
import { getIsAdmin } from '@/dashboard/actions'
import Shimmer from '@/ui/shimmer'
import Empty from '@/ui/empty'
import Spinner from '@/ui/spinner'
import { EMPTY_MESSAGES, ERRORS } from '@/lib/utils'
import Loader from '@/ui/loader'

/** Merge team players and participations for display */
function mergeTeamAndParticipations(team: any, participations: any[]) {
    const participationMap = participations.reduce((map, part) => {
        map[part.player.id] = part
        return map
    }, {} as Record<string, any>)

    return team.players.map((playerDetail: any) => {
        const participation = participationMap[playerDetail.player.id]
        return {
            id: participation?.id || `missing-${playerDetail.player.id}`,
            player: playerDetail.player,
            stats: participation?.stats || {points: 0, assists: 0, rebounds: 0},
            participationExists: Boolean(participation),
        }
    })
}

function getStatusBadgeColor(status: MatchStatus): string {
    switch (status) {
        case 'SCHEDULED':
            return 'bg-lul-yellow'
        case 'ONGOING':
            return 'bg-lul-green'
        case 'COMPLETED':
            return 'bg-lul-blue'
        case 'CANCELED':
            return 'bg-lul-red'
        default:
            return 'bg-lul-grey'
    }
}

function getStatusActions(status: MatchStatus) {
    if (status === 'SCHEDULED') {
        return [
            {label: 'Start Match', newStatus: 'ONGOING', color: 'bg-lul-green'},
            {label: 'Cancel Match', newStatus: 'CANCELED', color: 'bg-lul-red'},
        ]
    }
    if (status === 'ONGOING') {
        return [
            {label: 'Complete Match', newStatus: 'COMPLETED', color: 'bg-lul-blue'},
            {label: 'Cancel Match', newStatus: 'CANCELED', color: 'bg-lul-red'},
        ]
    }
    return []
}

export default function Page() {
    const {matchId} = useParams<{ matchId: string }>()
    const [loading, setLoading] = useState(true)
    const [match, setMatch] = useState<MatchWithDetails | null>(null)
    const [status, setStatus] = useState<MatchStatus | null>(null)
    const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false)

    // For the confirmation modal
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [modalTitle, setModalTitle] = useState('')
    const [modalMessage, setModalMessage] = useState('')
    const [modalAction, setModalAction] = useState<() => void>(() => () => {
    })

    const [isChangingStatus, setIsChangingStatus] = useState(false)

    useEffect(() => {
        async function fetchMatchData() {
            setUserIsAdmin(await getIsAdmin())
            setLoading(true)
            const fetchedMatch = (await getMatch(matchId)) as MatchWithDetails
            setMatch(fetchedMatch)
            setStatus(fetchedMatch?.status || null)
            setLoading(false)
        }

        fetchMatchData()
    }, [matchId])

    /**
     * Update the match status.
     * If 'COMPLETED', we confirm via modal.
     */
    const handleStatusChange = async (newStatus: MatchStatus) => {
        const applyStatus = async () => {
            try {
                setIsChangingStatus(true)
                await updateMatchStatus(matchId, newStatus)
                setStatus(newStatus)
                const refreshed = (await getMatch(matchId)) as MatchWithDetails
                setMatch(refreshed)
            } catch (error) {
                console.error(ERRORS.MATCH.ERROR_UPDATING_MATCH_STATUS, error)
            } finally {
                setIsChangingStatus(false)
            }
        }

        if (newStatus === 'COMPLETED') {
            setModalTitle('Finish Match?')
            setModalMessage('Are you sure you want to complete the match?')
            setModalAction(() => async () => {
                setModalIsOpen(false)
                await applyStatus()
            })
            setModalIsOpen(true)
        } else {
            await applyStatus()
        }
    }

    /**
     * Helper to see if a player is on the home team
     */
    function isPlayerOnHomeTeam(playerId: string) {
        if (!match) return false
        const homeIds = match.homeTeam.players.map((psd) => psd.playerId)
        return homeIds.includes(playerId)
    }

    /**
     * Handle +/- for a player's stats, updating scoreboard if it's points.
     * Use optimistic UI, revert if the server call fails.
     */
    const handleUpdateStats = async (playerStatId: string, statType: StatType, increment: boolean) => {
        if (!match) return

        // 1) Local/optimistic update
        setMatch((prev) => {
            if (!prev) return prev

            // Update the player's stats
            const updatedParts = prev.participations.map((p) => {
                if (p.stats?.id === playerStatId) {
                    return {
                        ...p,
                        stats: {
                            ...p.stats,
                            [statType]: p.stats[statType] + (increment ? 1 : -1),
                        },
                    }
                }
                return p
            })

            // If we're changing 'points' in an ONGOING or COMPLETED match => scoreboard
            let newHomeScore = prev.homeScore
            let newAwayScore = prev.awayScore
            if (statType === 'points' && (prev.status === 'ONGOING' || prev.status === 'COMPLETED')) {
                const changedParticipation = updatedParts.find((par) => par.stats?.id === playerStatId)
                if (changedParticipation) {
                    const thePlayerId = changedParticipation.player.id
                    const isHome = isPlayerOnHomeTeam(thePlayerId)
                    if (isHome) {
                        newHomeScore += increment ? 1 : -1
                    } else {
                        newAwayScore += increment ? 1 : -1
                    }
                }
            }

            return {
                ...prev,
                participations: updatedParts,
                homeScore: newHomeScore,
                awayScore: newAwayScore,
            }
        })

        // 2) Call server
        try {
            await updatePlayerStat(playerStatId, statType, increment)
        } catch (error) {
            console.error(ERRORS.MATCH.ERROR_UPDATING_STATS, error)
            // 3) Revert by fetching fresh data if error
            setLoading(true)
            const fetched = (await getMatch(matchId)) as MatchWithDetails
            setMatch(fetched)
            setLoading(false)
        }
    }

    // ----------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------
    if (loading) return <Loader/>

    if (!match) return <Empty message={EMPTY_MESSAGES.MATCH_DOES_NOT_EXIST}/>

    const dateStr = new Date(match.date).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        day: 'numeric',
    })

    // scoreboard color
    const scoreboardColor =
        match.status === 'ONGOING'
            ? 'text-lul-green'
            : match.status === 'COMPLETED'
                ? 'text-lul-blue'
                : 'text-white'
    const showScoreboard = match.status === 'ONGOING' || match.status === 'COMPLETED'
    const actionButtons = getStatusActions(match.status)

    return (
        <>
            <MessageModal
                title={modalTitle}
                message={modalMessage}
                isOpen={modalIsOpen}
                close={() => setModalIsOpen(false)}
                action={modalAction}
            />

            <div className="w-full h-full flex flex-col text-white">
                {/* TOP / SCOREBOARD / STATUS */}
                <div className="flex flex-col gap-y-4 p-4 lg:py-5">
                    {/* Status badge */}
                    <div
                        className={clsx(
                            'w-full py-2 rounded-md text-center text-xl font-bold text-lul-black',
                            getStatusBadgeColor(match.status)
                        )}
                    >
                        {match.status}
                    </div>

                    {/* TEAMS + SCORE (mobile stacked, desktop row) */}
                    <div className="block lg:hidden text-center text-3xl font-bold w-full max-w-screen-lg mx-auto">
                        <div>{match.homeTeam.name}</div>
                        {showScoreboard ? (
                            <div className={clsx('text-7xl font-extrabold my-2', scoreboardColor)}>
                                {match.homeScore} - {match.awayScore}
                            </div>
                        ) : (
                            <div className="text-5xl my-2">⚡️</div>
                        )}
                        <div>{match.awayTeam.name}</div>
                    </div>
                    <div className="hidden lg:flex w-full max-w-screen-lg mx-auto justify-between text-3xl font-bold">
                        <div className="w-1/3">{match.homeTeam.name}</div>
                        {showScoreboard ? (
                            <h1 className={clsx('w-1/3 text-7xl text-center font-extrabold', scoreboardColor)}>
                                {match.homeScore} - {match.awayScore}
                            </h1>
                        ) : (
                            <h1 className="w-1/3 text-5xl text-center">⚡️</h1>
                        )}
                        <div className="w-1/3 text-right">{match.awayTeam.name}</div>
                    </div>

                    {/* Date + Season */}
                    <div className="flex flex-col items-center">
                        <p className="text-lul-blue text-lg">{match.season.name}</p>
                        <h1 className="text-lg">{dateStr}</h1>
                    </div>

                    {/* Status buttons */}
                    {actionButtons.length > 0 && userIsAdmin && (
                        <div className="w-full flex gap-4 justify-center items-center">
                            {actionButtons.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => handleStatusChange(action.newStatus as MatchStatus)}
                                    className={clsx(
                                        'lg:w-1/6 w-full px-3 py-2 rounded-md text-white text-sm font-medium uppercase transition-colors border border-transparent',
                                        action.color
                                    )}
                                    disabled={isChangingStatus}
                                >
                                    {action.label}
                                </button>
                            ))}
                            {isChangingStatus && <Spinner/>}
                        </div>
                    )}
                </div>

                {/* BOTTOM: Two columns, each with sticky team header */}
                <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">

                    {/* HOME COLUMN */}
                    <div className="flex-1 flex flex-col lg:overflow-hidden">
                        {/* Sticky header (TEAM NAME, etc.) */}
                        <div className="lg:bg-opacity-0 bg-lul-black sticky top-0 z-10 border-b border-lul-blue text-2xl font-semibold p-4 flex items-baseline">
                            <h1 className="flex flex-1">{match.homeTeam.name}</h1>
                            <h3 className="uppercase text-sm">Player Stats</h3>
                        </div>

                        {/* Scrollable stats area */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {mergeTeamAndParticipations(match.homeTeam, match.participations).map(
                                ({id, player, stats, participationExists}: any) => (
                                    <div key={id} className="flex flex-col p-4 bg-lul-light-grey/10 rounded-md">
                                        <h3 className="flex-1 text-2xl font-bold">{player.user.name}</h3>
                                        <div className="w-full mt-4 flex justify-between gap-2">
                                            {['points', 'assists', 'rebounds'].map((statKey) => (
                                                <div
                                                    key={statKey}
                                                    className="flex flex-col items-center text-2xl gap-y-4"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div className="uppercase text-xs antialiased">{statKey}</div>
                                                        <div className={clsx('font-bold',
                                                            {
                                                                'text-lul-green': statKey === 'points',
                                                                'text-lul-blue': statKey === 'assists',
                                                                'text-lul-yellow': statKey === 'rebounds',
                                                            }
                                                        )}>
                                                            {stats[statKey]}
                                                        </div>
                                                    </div>
                                                    {participationExists && userIsAdmin && (
                                                        <>
                                                            <button
                                                                disabled={match.status !== 'ONGOING'}
                                                                className={clsx(
                                                                    'px-4 rounded-md text-white mt-1 bg-lul-green',
                                                                    {'opacity-30': match.status !== 'ONGOING'}
                                                                )}
                                                                onClick={() =>
                                                                    handleUpdateStats(stats.id, statKey as StatType, true)
                                                                }
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                disabled={match.status !== 'ONGOING'}
                                                                className={clsx(
                                                                    'px-5 rounded-md text-white mt-1 bg-lul-red',
                                                                    {'opacity-30': match.status !== 'ONGOING'}
                                                                )}
                                                                onClick={() =>
                                                                    handleUpdateStats(stats.id, statKey as StatType, false)
                                                                }
                                                            >
                                                                -
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* blue divider on large screens */}
                    <div className="w-0.5 bg-lul-blue hidden lg:block"/>

                    {/* AWAY COLUMN */}
                    <div className="flex-1 flex flex-col lg:overflow-hidden">
                        {/* Sticky header */}
                        <div className="lg:bg-opacity-0 bg-lul-black sticky top-0 z-10 border-b border-lul-blue text-2xl font-semibold p-4 flex items-baseline">
                            <h1 className="flex flex-1">{match.awayTeam.name}</h1>
                            <h3 className="uppercase text-sm">Player Stats</h3>
                        </div>

                        {/* Scrollable stats area */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {mergeTeamAndParticipations(match.awayTeam, match.participations).map(
                                ({id, player, stats, participationExists}: any) => (
                                    <div key={id} className="flex flex-col p-4 bg-lul-light-grey/10 rounded-md">
                                        <h3 className="flex-1 text-2xl font-bold">{player.user.name}</h3>
                                        <div className="w-full mt-4 flex justify-between gap-2">
                                            {['points', 'assists', 'rebounds'].map((statKey) => (
                                                <div
                                                    key={statKey}
                                                    className="flex flex-col items-center text-2xl gap-y-4"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div className="uppercase text-xs antialiased">{statKey}</div>
                                                        <div className={clsx('font-bold',
                                                            {
                                                                'text-lul-green': statKey === 'points',
                                                                'text-lul-blue': statKey === 'assists',
                                                                'text-lul-yellow': statKey === 'rebounds',
                                                            }
                                                        )}>
                                                            {stats[statKey]}
                                                        </div>
                                                    </div>
                                                    {participationExists && userIsAdmin && (
                                                        <>
                                                            <button
                                                                disabled={match.status !== 'ONGOING'}
                                                                className={clsx(
                                                                    'px-4 rounded-md text-white mt-1 bg-lul-green',
                                                                    {'opacity-30': match.status !== 'ONGOING'}
                                                                )}
                                                                onClick={() =>
                                                                    handleUpdateStats(stats.id, statKey as StatType, true)
                                                                }
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                disabled={match.status !== 'ONGOING'}
                                                                className={clsx(
                                                                    'px-5 rounded-md text-white mt-1 bg-lul-red',
                                                                    {'opacity-30': match.status !== 'ONGOING'}
                                                                )}
                                                                onClick={() =>
                                                                    handleUpdateStats(stats.id, statKey as StatType, false)
                                                                }
                                                            >
                                                                -
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
