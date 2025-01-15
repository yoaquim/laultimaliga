'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useParams, useSearchParams } from 'next/navigation'
import { MatchStatus } from '@prisma/client'
import MessageModal from '@/ui/message-modal'
import { MatchWithDetails, StatType } from './types'
import { getMatch, updateMatchStatus, updatePlayerStat } from './actions'
import { getIsAdmin } from '@/dashboard/actions'
import Empty from '@/ui/empty'
import { DOMAIN, EMPTY_MESSAGES, ERRORS, formatTimeElapsed, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import Loader from '@/ui/loader'
import Link from 'next/link'

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
            return 'text-lul-yellow'
        case 'ONGOING':
            return 'text-lul-green'
        case 'COMPLETED':
            return 'text-lul-blue'
        case 'CANCELED':
            return 'text-lul-red'
        default:
            return 'text-lul-grey'
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
    const searchParams = useSearchParams()
    const time: number = parseInt(searchParams.get('time') || '720')
    const [loading, setLoading] = useState(true)
    const [match, setMatch] = useState<MatchWithDetails | null>(null)
    const [status, setStatus] = useState<MatchStatus | null>(null)
    const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false)

    // Popup Scoreboard
    const [homeTeamScore, setHomeTeamScore] = useState<number>(0)
    const [awayTeamScore, setAwayTeamScore] = useState<number>(0)
    const [scoreboard, setScoreboard] = useState<Window | null>(null)
    const [timerRunning, setTimerRunning] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(time)

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
            setHomeTeamScore(fetchedMatch.homeScore)
            setAwayTeamScore(fetchedMatch.awayScore)
            setLoading(false)
        }

        fetchMatchData()
    }, [matchId])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (timerRunning) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval!)
                        return 0 // Stop at 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else if (!timerRunning && interval) {
            clearInterval(interval)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [timerRunning])

    useEffect(() => {
        const sendTimerUpdate = () => {
            if (scoreboard && !scoreboard.closed) {
                scoreboard.postMessage({
                    type: 'SYNC_TIMER',
                    timeRemaining,
                })
            }
        }

        if (timerRunning) {
            const interval = setInterval(sendTimerUpdate, 1000)
            return () => clearInterval(interval)
        }
    }, [timerRunning, timeRemaining, scoreboard])

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

                if (newStatus === 'ONGOING') {
                    setTimerRunning(true)
                } else if (newStatus === 'COMPLETED') {
                    setTimerRunning(false)
                } else {
                    setTimerRunning(false)
                }
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

            // Update scoreboard
            if (scoreboard && !scoreboard.closed) {
                scoreboard.postMessage({
                    type: 'UPDATE_SCORE',
                    homeScore: newHomeScore,
                    awayScore: newAwayScore,
                })
            }

            setHomeTeamScore(newHomeScore)
            setAwayTeamScore(newAwayScore)
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

    const handleOpenScoreboard = () => {
        if (!userIsAdmin) return
        if (!match) return

        if (!scoreboard || scoreboard.closed) {
            const newScoreboard = window.open(
                `${DOMAIN}/scoreboard?homeTeamScore=${homeTeamScore}&homeTeamLogo=${match.homeTeam.logo}&awayTeamScore=${awayTeamScore}&awayTeamLogo=${match.awayTeam.logo}&time=${timeRemaining}`,
                '_blank',
                'width=screen,height=screen,scrollbars=no,resizable=yes'
            )
            if (newScoreboard) {
                // on close
            }
            setScoreboard(newScoreboard)
        } else {
            scoreboard.focus() // Bring existing popup to the front
        }
    }

    const handleStartStopTimer = () => {
        setTimerRunning((prev) => {
            const running = !prev
            if (scoreboard && !scoreboard.closed) {
                scoreboard.postMessage({type: 'TIMER_CONTROL', running})
            }
            return running
        })
    }

    // ================================================================
    // RENDER
    // ================================================================
    if (loading) return <Loader/>

    if (!match) return <Empty message={EMPTY_MESSAGES.MATCH_DOES_NOT_EXIST}/>

    const dateStr = new Date(match.date).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        day: 'numeric',
    })

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
                <div className="flex flex-col lg:gap-y-4 p-4 lg:py-5">
                    {/*----------------------------------------------------*/}
                    {/*====================================================*/}
                    {/* TEAMS + SCORE (mobile stacked, desktop row) */}
                    {/*====================================================*/}
                    {/*----------------------------------------------------*/}

                    {/*====================================================*/}
                    {/* MOBILE */}
                    {/*====================================================*/}
                    <div className="block lg:hidden text-center text-3xl font-bold w-full max-w-screen-lg mx-auto py-6">
                        {showScoreboard &&
                            <div className="w-full flex justify-between items-center">
                                <h1>{match.homeScore}</h1>
                                <img src="/ball.svg" alt="ball" className="w-9 cursor-pointer" onClick={handleOpenScoreboard}/>
                                <h1>{match.awayScore}</h1>
                            </div>
                        }

                        <div className="mt-4 flex justify-between items-center">
                            <img src={TEAM_LOGO_URL_BUILDER(match.homeTeam.logo)} alt="team-logo" className="h-24"/>
                            <img src={TEAM_LOGO_URL_BUILDER(match.awayTeam.logo)} alt="team-logo" className="h-24"/>
                        </div>
                    </div>

                    {/*====================================================*/}
                    {/* DESKTOP */}
                    {/*====================================================*/}
                    <div className="hidden lg:flex w-full max-w-screen-lg mx-auto justify-between text-3xl font-bold">
                        <div className="w-1/3 flex flex-col pt-4">
                            <Link href={`/dashboard/teams/${match.homeTeam.id}`} className="w-full h-full flex justify-start items-center">
                                <img src={TEAM_LOGO_URL_BUILDER(match.homeTeam.logo)} alt="team-logo" className="h-56"/>
                            </Link>
                        </div>

                        <div className="w-1/3 h-full flex flex-col justify-between items-center gap-y-2">
                            {/*----------------------------------------------------*/}
                            {/* STATUS BADGE */}
                            {/*----------------------------------------------------*/}
                            <div
                                className={clsx('py-2 px-4 z-10 rounded-md text-center text-xl font-bold bg-lul-dark-grey/90',
                                    getStatusBadgeColor(match.status)
                                )}>
                                {match.status}
                            </div>

                            {/*----------------------------------------------------*/}
                            {/* SCORE BOARD / VS BADGE */}
                            {/*----------------------------------------------------*/}
                            {showScoreboard &&
                                <div className={clsx('flex flex-col flex-1 w-full text-8xl font-extrabold justify-center items-center gap-x-10 text-lul-yellow')}>
                                    <div className="w-full flex justify-between items-center">
                                        <h1>{match.homeScore}</h1>
                                        <img src="/ball.svg" alt="ball" className="w-9 cursor-pointer" onClick={handleOpenScoreboard}/>
                                        <h1>{match.awayScore}</h1>
                                    </div>

                                    <div className="w-full flex flex-col justify-center items-center gap-y-6">
                                        {userIsAdmin && match.status !== 'COMPLETED' && (
                                            <div className="font-bold text-4xl text-lul-red/80">
                                                {formatTimeElapsed(timeRemaining)}
                                            </div>
                                        )}

                                        {userIsAdmin && match.status === 'ONGOING' && (
                                            <button
                                                className={clsx('w-full py-2 text-base text-white rounded uppercase font-bold',
                                                    {
                                                        'bg-lul-red/70': timerRunning,
                                                        'bg-lul-green/70': !timerRunning
                                                    }
                                                )}
                                                onClick={handleStartStopTimer}
                                            >
                                                {timerRunning ? 'Stop' : 'Start'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            }
                            {!showScoreboard &&
                                <div className="2xl:w-32 w-20 flex items-center justify-center">
                                    <img src="/ball.svg" alt="ball"/>
                                </div>
                            }

                            {/*----------------------------------------------------*/}
                            {/* DATE + SEASON */}
                            {/*----------------------------------------------------*/}
                            <div className="flex flex-col align-bottom items-center">
                                <p className="text-lul-blue text-lg">{match.season.name}</p>
                                <h1 className="text-lg">{dateStr}</h1>
                            </div>
                        </div>

                        <div className="w-1/3 flex flex-col pt-4">
                            <Link href={`/dashboard/teams/${match.awayTeam.id}`} className="w-full h-full flex justify-end items-center">
                                <img src={TEAM_LOGO_URL_BUILDER(match.awayTeam.logo)} alt="team-logo" className="h-56"/>
                            </Link>
                        </div>
                    </div>


                    {/*====================================================*/}
                    {/* STATUS BUTTONS */}
                    {/*====================================================*/}
                    {actionButtons.length > 0 && userIsAdmin && (
                        <div className="w-full flex flex-col">
                            <div className="w-full flex gap-4 justify-center items-center lg:pt-0 pt-4">
                                {!isChangingStatus && actionButtons.map((action) => (
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
                            </div>
                            {isChangingStatus && <Loader full/>}
                        </div>
                    )}
                </div>

                {/*====================================================*/}
                {/* STAT TRACKER*/}
                {/*====================================================*/}
                <div className="flex-1 flex flex-col lg:flex-row lg:gap-x-5 lg:overflow-hidden">
                    {/*----------------------------------------------------*/}
                    {/* HOME TEAM */}
                    {/*----------------------------------------------------*/}
                    <Tracker
                        match={match}
                        team="homeTeam"
                        userIsAdmin={userIsAdmin}
                        handleUpdateStats={handleUpdateStats}/>

                    {/*----------------------------------------------------*/}
                    {/* AWAY TEAM */}
                    {/*----------------------------------------------------*/}
                    <Tracker
                        match={match}
                        team="awayTeam"
                        userIsAdmin={userIsAdmin}
                        handleUpdateStats={handleUpdateStats}/>
                </div>
            </div>
        </>
    )
}

function Tracker({
                     match,
                     team,
                     userIsAdmin,
                     handleUpdateStats
                 }: {
    match: MatchWithDetails,
    team: 'homeTeam' | 'awayTeam'
    userIsAdmin: boolean,
    handleUpdateStats: (id: string, statKey: StatType, increment: boolean) => void
}) {
    const statKeys = ['points', 'assists', 'rebounds', 'fouls']
    const statAbbrv: Record<string, string> = {
        points: 'PTS',
        assists: 'AST',
        rebounds: 'REB',
        fouls: 'FLS',
    }


    return (
        <div className="flex-1 flex flex-col lg:overflow-hidden bg-lul-grey/20 rounded-md px-4">
            {/* Sticky header */}
            <div className={clsx('lg:bg-opacity-0 sticky top-0 z-10 border-b text-2xl font-semibold py-2 flex items-end', {
                'border-lul-blue': match.status === 'COMPLETED',
                'border-lul-green': match.status === 'ONGOING',
                'border-lul-yellow': match.status === 'SCHEDULED',
                'border-lul-red': match.status === 'CANCELED'
            })}>
                <h1 className="flex flex-1 uppercase text-xl">{match[team].name}</h1>
            </div>

            {/* Scrollable stats area */}
            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 2xl:grid-cols-3 gap-6">
                {mergeTeamAndParticipations(match[team], match.participations).map(
                    ({id, player, stats, participationExists}: any) => (

                        <div key={id} className="flex flex-col p-4 bg-lul-light-grey/10 rounded-md">
                            <Link href={`/dashboard/players/${player.id}`} target="_blank" className="flex justify-between gap-x-2 text-xl font-bold rounded bg-lul-dark-grey/80 px-2">
                                <span className="text-lul-orange">#{player.seasonDetails?.[0]?.number || 'N/A'}</span>
                                <span className="overflow-x-hidden whitespace-nowrap overflow-ellipsis">{player.user.name}</span>
                            </Link>

                            <div className="w-full mt-4 flex justify-between gap-2">
                                {statKeys.map((statKey) => (
                                    <div key={statKey} className="flex flex-col items-center text-2xl gap-y-2">
                                        <div className="flex flex-col gap-y-2 items-center antialiased">
                                            <div className={clsx('uppercase text-sm font-bold',
                                                {
                                                    'text-lul-green': statKey === 'points',
                                                    'text-lul-blue': statKey === 'assists',
                                                    'text-lul-yellow': statKey === 'rebounds',
                                                    'text-lul-red': statKey === 'fouls',
                                                }
                                            )}>
                                                {statAbbrv[statKey]}
                                            </div>
                                            <div className="text-2xl">{stats[statKey]}</div>
                                        </div>

                                        {participationExists && userIsAdmin && (
                                            <div className="flex flex-col gap-y-2">
                                                <button
                                                    disabled={match.status !== 'ONGOING'}
                                                    className={clsx(
                                                        'px-2 rounded text-white mt-1 bg-lul-green',
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
                                                        'px-3 rounded text-white mt-1 bg-lul-red',
                                                        {'opacity-30': match.status !== 'ONGOING'}
                                                    )}
                                                    onClick={() =>
                                                        handleUpdateStats(stats.id, statKey as StatType, false)
                                                    }
                                                >
                                                    -
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}