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
import { BUCKET_ENDPOINT, DOMAIN, EMPTY_MESSAGES, ERRORS, formatTimeElapsed, PROFILE_PIC_BUILDER, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import Loader from '@/ui/loader'
import Link from 'next/link'
import { Container } from '@/ui/container'
import CardGrid from '@/ui/card-grid'

import { MdScoreboard } from 'react-icons/md'
import { FaHandsHelping } from 'react-icons/fa'
import { MdSportsHandball } from 'react-icons/md'
import { MdSports } from 'react-icons/md'
import { IconType } from 'react-icons'
import { FaPlusSquare, FaMinusSquare } from 'react-icons/fa'
import Score from '@/ui/score'
import { format, toZonedTime } from 'date-fns-tz'


const iconMap: Record<StatType, IconType> = {
    points: MdScoreboard,
    assists: FaHandsHelping,
    rebounds: MdSportsHandball,
    fouls: MdSports
}

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
                setTimerRunning(false)
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

    const handleBuzzer = () => {
        if (status === 'ONGOING') {
            const buzzer = new Audio(`${BUCKET_ENDPOINT}/assets/buzzer.wav`)
            buzzer.play().catch((err) => console.error('Error playing buzzer sound:', err))
        }
    }

    // ================================================================
    // RENDER
    // ================================================================
    if (loading) return <Loader/>

    if (!match) return <Empty message={EMPTY_MESSAGES.MATCH_DOES_NOT_EXIST}/>

    const zonedDate = toZonedTime(match.date, 'UTC')
    const dateStr = format(zonedDate, 'MMMM d, yyyy')

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

            <Container>
                <div className="flex flex-col lg:gap-y-4 p-4 px-0 lg:px-4 lg:py-5">
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
                            <div className="w-full flex justify-between items-center text-lul-yellow">
                                <h1 className={clsx('w-1/3 flex justify-start pl-2 text-8xl', {
                                    'text-lul-green': match.winnerId && match.winnerId === match.homeTeam.id,
                                    'text-lul-red': match.winnerId && match.winnerId === match.awayTeam.id
                                })}>
                                    <Score value={match.homeScore}/>
                                </h1>

                                {/* STATUS BADGE */}
                                <div className="w-1/2 flex justify-center">
                                    <div
                                        className={clsx('py-2 px-4 z-10 rounded-md text-center text-xl font-bold bg-lul-dark-grey/90',
                                            getStatusBadgeColor(match.status)
                                        )}>
                                        {match.status}
                                    </div>
                                </div>
                                <h1 className={clsx('w-1/3 flex justify-end pr-2 text-8xl', {
                                    'text-lul-green': match.winnerId && match.winnerId === match.awayTeam.id,
                                    'text-lul-red': match.winnerId && match.winnerId === match.homeTeam.id
                                })}>
                                    <Score value={match.awayScore}/>
                                </h1>

                            </div>
                        }

                        <div className="mt-4 flex justify-between items-center">
                            <img src={TEAM_LOGO_URL_BUILDER(match.homeTeam.logo)} alt="team-logo" className="h-24 self-start"/>
                            <img src="/ball.svg" alt="ball" className="w-9 cursor-pointer" onClick={handleOpenScoreboard}/>
                            <img src={TEAM_LOGO_URL_BUILDER(match.awayTeam.logo)} alt="team-logo" className="h-24 self-end"/>
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
                            <button
                                onClick={handleBuzzer}
                                className={clsx('py-2 px-4 z-10 rounded-md text-center text-xl font-bold bg-lul-dark-grey/90',
                                    getStatusBadgeColor(match.status)
                                )}>
                                {match.status}
                            </button>

                            {/*----------------------------------------------------*/}
                            {/* SCORE BOARD / VS BADGE */}
                            {/*----------------------------------------------------*/}
                            {showScoreboard &&
                                <div className={clsx('mt-8 flex flex-col flex-1 w-full text-10xl font-extrabold justify-center items-center gap-x-10 text-lul-yellow')}>
                                    <div className="w-full flex items-center">
                                        <h1 className={clsx('w-1/3 flex justify-center', {
                                            'text-lul-green': match.winnerId && match.winnerId === match.homeTeam.id,
                                            'text-lul-red': match.winnerId && match.winnerId === match.awayTeam.id
                                        })}>
                                            <Score value={match.homeScore}/>
                                        </h1>

                                        <div className="w-1/3 flex justify-center">
                                            <img src="/ball.svg" alt="ball" className="w-9 cursor-pointer" onClick={handleOpenScoreboard}/>
                                        </div>

                                        <h1 className={clsx('w-1/3 flex justify-center', {
                                            'text-lul-green': match.winnerId && match.winnerId === match.awayTeam.id,
                                            'text-lul-red': match.winnerId && match.winnerId === match.homeTeam.id
                                        })}>
                                            <Score value={match.awayScore}/>
                                        </h1>
                                    </div>

                                    <div className="w-full flex flex-col justify-center items-center">
                                        {userIsAdmin && match.status !== 'COMPLETED' && (
                                            <Score className="py-2 font-bold text-5xl text-lul-red/80" value={formatTimeElapsed(timeRemaining)}/>
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
                <div className="flex-1 flex flex-col gap-y-5 lg:flex-row lg:gap-x-5 lg:overflow-hidden">
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
            </Container>
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

    const borderColor =
        match.status === 'COMPLETED' ? 'blue' :
            match.status === 'ONGOING' ? 'green' :
                match.status === 'SCHEDULED' ? 'yellow' : 'red'
    return (
        <CardGrid title={match[team].name} borderTitleColor={borderColor}>
            {mergeTeamAndParticipations(match[team], match.participations).map(
                ({id, player, stats, participationExists}: any) => {
                    if (participationExists) return (

                        // ===================================================
                        // PLAYER CARD
                        // ===================================================
                        <div key={id} className="relative flex flex-col p-4 bg-lul-light-grey/10 rounded-md">

                            {/*====================================================*/}
                            {/* PLAYER NUMBER */}
                            {/*====================================================*/}
                            <div className="absolute top-0.5 right-4 font-bold text-white">
                                <Score className="text-4xl lg:text-3xl" value="#"/>
                                <Score className="text-6xl lg:text-5xl" value={`${player.seasonDetails[0]?.number}`}/>
                            </div>

                            {/*====================================================*/}
                            {/* PROFILE PIC + NAME */}
                            {/*====================================================*/}
                            <Link href={`/dashboard/players/${player.id}`} className="flex flex-col items-center gap-y-2">
                                <img src={PROFILE_PIC_BUILDER(player.user)} alt="profile-image" className="rounded-full object-cover w-16 h-16"/>
                                <span className="uppercase font-bold">{player.user.name}</span>
                            </Link>

                            {/*====================================================*/}
                            {/* STAT TRACKER*/}
                            {/*====================================================*/}
                            <div className="w-full mt-4 flex justify-between gap-2">
                                {statKeys.map((statKey) => (
                                    <div key={statKey} className="flex flex-col items-center text-2xl gap-y-2">

                                        {/*----------------------------------------------------*/}
                                        {/* USER ONLY: SHOW ICONS, STAT VALUE, & STAT ABBRV */}
                                        {/*----------------------------------------------------*/}
                                        {participationExists && !userIsAdmin &&
                                            <div className="flex flex-col gap-y-2 items-center antialiased">
                                                <div className={clsx('uppercase text-sm font-bold',
                                                    {
                                                        'text-lul-green': statKey === 'points',
                                                        'text-lul-blue': statKey === 'assists',
                                                        'text-lul-yellow': statKey === 'rebounds',
                                                        'text-lul-red': statKey === 'fouls',
                                                    }
                                                )}>
                                                    {iconMap[statKey as StatType]({
                                                        className: `text-3xl antialiased ${
                                                            statKey === 'points' ? 'text-lul-green' :
                                                                statKey === 'assists' ? 'text-lul-blue' :
                                                                    statKey === 'rebounds' ? 'text-lul-yellow' :
                                                                        statKey === 'fouls' ? 'text-lul-red' : 'text-white'

                                                        }`
                                                    })}
                                                </div>
                                                <div className="text-4xl"><Score value={stats[statKey]}/></div>
                                                <div className="text-xs text-lul-light-grey uppercase font-bold">{statAbbrv[statKey]}</div>
                                            </div>
                                        }

                                        {/*----------------------------------------------------*/}
                                        {/* ADMIN ONLY: SHOW STAT ABBRV, STAT VALUE, & CONTROLS  */}
                                        {/*----------------------------------------------------*/}
                                        {userIsAdmin &&
                                            <div className="flex flex-col gap-y-1 items-center antialiased">

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

                                                <button onClick={() => handleUpdateStats(stats.id, statKey as StatType, true)}>
                                                    <FaPlusSquare
                                                        className={clsx('text-3xl', {
                                                            'text-lul-green': match.status === 'ONGOING',
                                                            'text-lul-dark-grey': match.status !== 'ONGOING',
                                                        })}
                                                    />
                                                </button>

                                                <div className="text-4xl py-0.5"><Score value={stats[statKey]}/></div>

                                                <button onClick={() => handleUpdateStats(stats.id, statKey as StatType, false)}>
                                                    <FaMinusSquare
                                                        className={clsx('text-3xl', {
                                                            'text-lul-red': match.status === 'ONGOING',
                                                            'text-lul-dark-grey': match.status !== 'ONGOING',
                                                        })}
                                                    />
                                                </button>
                                            </div>
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
        </CardGrid>
    )
}