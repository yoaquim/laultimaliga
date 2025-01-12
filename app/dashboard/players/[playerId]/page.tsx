import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import clsx from 'clsx'

type PlayerDetail = Prisma.PlayerGetPayload<{
    include: {
        user: true
        totalStats: true
        SeasonStats: {
            include: {
                season: true
            }
        }
        seasonDetails: {
            include: {
                season: true
                team: true
            }
        }
        participations: {
            include: {
                match: {
                    include: {
                        season: true
                    }
                }
            }
        }
    }
}>

async function getPlayer(playerId: string): Promise<PlayerDetail | null> {
    return prisma.player.findUnique({
        where: {id: playerId},
        include: {
            user: true,
            totalStats: true,
            SeasonStats: {
                include: {
                    season: true,
                },
            },
            seasonDetails: {
                include: {
                    season: true,
                    team: true,
                },
            },
            participations: {
                include: {
                    match: {
                        include: {
                            season: true,
                        },
                    },
                },
            },
        },
    })
}

export default async function Page({params}: { params: { playerId: string } }) {
    const {playerId} = params
    const player = await getPlayer(playerId)

    if (!player) {
        return <Empty message={EMPTY_MESSAGES.NO_PLAYERS}/>
    }

    // Find an "active" or "current" season detail to show the player's current team
    const activeSeasonDetail = player.seasonDetails.find((sd) => sd.season.isActive)
    const currentTeam = activeSeasonDetail?.team

    // total stats
    const {
        points: totalPoints = 0,
        assists: totalAssists = 0,
        rebounds: totalRebounds = 0,
        gamesPlayed: totalGP = 0,
    } = player.totalStats || {}

    // Find "current" SeasonStats record (for the active season)
    const activeSeasonStats = player.SeasonStats.find(
        (st) => st.season.isActive === true
    )
    const {
        points: seasonPoints = 0,
        assists: seasonAssists = 0,
        rebounds: seasonRebounds = 0,
        gamesPlayed: seasonGP = 0,
    } = activeSeasonStats || {}

    // Gather matches (by date ascending)
    const matches = player.participations
        .map((p) => p.match)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
        <div className="w-full h-full flex flex-col gap-y-8 py-8 px-4 text-white">

            {/* --- PLAYER HEADER --- */}
            <div className="flex flex-col items-center gap-y-2">
                {/* Player Name */}
                <h1 className="text-4xl font-bold tracking-wide">{player.user.name}</h1>

                {/* Subheading */}
                <p className="text-lul-blue uppercase tracking-wider text-sm font-semibold">
                    Player Profile
                </p>

                {/* Additional Info (Email, Phone, Size, Team) */}
                <div className="mt-2 flex flex-col items-center text-lul-light-grey text-sm">
                    {player.user.email && (
                        <p>
                            <span className="font-semibold mr-2 text-lul-orange">Email:</span>
                            {player.user.email}
                        </p>
                    )}
                    {player.user.phone && (
                        <p>
                            <span className="font-semibold mr-2 text-lul-orange">Phone:</span>
                            {player.user.phone}
                        </p>
                    )}
                    <p>
                        <span className="font-semibold mr-2 text-lul-orange">Size:</span>
                        {player.size}
                    </p>
                    <p>
                        <span className="font-semibold mr-2 text-lul-orange">Team:</span>
                        {currentTeam ? currentTeam.name : 'No Current Team'}
                    </p>
                </div>
            </div>

            {/* --- STATS SECTION --- */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Total Stats Card */}
                <div className="flex-1 bg-lul-grey/20 rounded-md p-4">
                    <h2 className="text-center text-xl font-bold uppercase text-lul-yellow">
                        Total Stats
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Points</p>
                            <p className="text-3xl font-bold text-lul-green">{totalPoints}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Assists</p>
                            <p className="text-3xl font-bold text-lul-green">{totalAssists}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Rebounds</p>
                            <p className="text-3xl font-bold text-lul-green">{totalRebounds}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Games</p>
                            <p className="text-3xl font-bold text-lul-green">{totalGP}</p>
                        </div>
                    </div>
                </div>

                {/* Current Season Stats Card */}
                <div className="flex-1 bg-lul-grey/20 rounded-md p-4">
                    <h2 className="text-center text-xl font-bold uppercase text-lul-yellow">
                        Current Season
                    </h2>
                    {activeSeasonDetail ? (
                        <p className="text-center text-sm text-lul-light-grey">
                            {activeSeasonDetail.season.name}
                        </p>
                    ) : (
                        <p className="text-center text-sm text-lul-red">
                            No Active Season Found
                        </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Points</p>
                            <p className="text-3xl font-bold text-lul-green">{seasonPoints}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Assists</p>
                            <p className="text-3xl font-bold text-lul-green">{seasonAssists}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Rebounds</p>
                            <p className="text-3xl font-bold text-lul-green">{seasonRebounds}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="uppercase text-xs text-lul-blue tracking-wider">Games</p>
                            <p className="text-3xl font-bold text-lul-green">{seasonGP}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MATCHES SECTION --- */}
            <div className="flex flex-col flex-1">
                <h2 className="text-xl font-bold uppercase text-lul-yellow mb-2">
                    Matches Played
                </h2>
                {matches.length === 0 ? (
                    <Empty message={EMPTY_MESSAGES.NO_MATCHES}/>
                ) : (
                    <div className="flex-1 overflow-y-auto bg-lul-grey/20 rounded-md p-4">
                        <ul className="flex flex-col gap-y-4">
                            {matches.map((m) => {
                                const date = new Date(m.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })
                                return (
                                    <li
                                        key={m.id}
                                        className="bg-lul-black/20 p-3 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-2"
                                    >
                                        <div className="flex flex-col">
                                            {/* Score or Status */}
                                            <span className="text-lg font-bold text-lul-green">
                        {m.homeScore} - {m.awayScore}
                      </span>
                                            <span className="text-sm text-lul-light-grey">
                        {m.season.name} | {date}
                      </span>
                                        </div>
                                        <div>
                      <span
                          className={clsx('text-sm font-semibold uppercase', {
                              'text-lul-yellow': m.status === 'SCHEDULED',
                              'text-lul-green': m.status === 'ONGOING',
                              'text-lul-blue': m.status === 'COMPLETED',
                              'text-lul-red': m.status === 'CANCELED',
                          })}
                      >
                        {m.status}
                      </span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
