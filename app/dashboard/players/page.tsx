import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

type PlayerWithDetails = Prisma.PlayerGetPayload<{
    include: {
        user: true
        seasonDetails: {
            include: {
                team: {
                    include: {
                        season: true
                    }
                }
            }
        }
        totalStats: true
    }
}>

export default async function Page() {
    const players: PlayerWithDetails[] = await prisma.player.findMany({
        include: {
            user: true,
            seasonDetails: {
                include: {
                    team: {
                        include: {
                            season: true,
                        },
                    },
                },
            },
            participations: {
                include: {
                    stats: true, // Include individual game stats
                },
            },
            totalStats: true, // Include cumulative stats
        },
    })

    const calculateStatsAverage = (participations: PlayerWithDetails[]) => {
        if (!participations || participations.length === 0) {
            return {points: 0, assists: 0, rebounds: 0, gamesPlayed: 0}
        }

        let totalPoints = 0
        let totalAssists = 0
        let totalRebounds = 0
        let totalGames = 0

        participations.forEach((p) => {
            if (p.stats) {
                totalPoints += p.stats.points || 0
                totalAssists += p.stats.assists || 0
                totalRebounds += p.stats.rebounds || 0
                totalGames += 1
            }
        })

        return {
            points: totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : '0.0',
            assists: totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : '0.0',
            rebounds: totalGames > 0 ? (totalRebounds / totalGames).toFixed(1) : '0.0',
        }
    }

    return (
        <Grid title="Players">
            {players.length === 0 && <Empty message={EMPTY_MESSAGES.NO_PLAYERS}/>}
            {players.length > 0 &&
                players.map((player) => {
                    const statsAverage = calculateStatsAverage(player.participations)

                    return (
                        <Link
                            key={player.id}
                            href={`/dashboard/players/${player.id}`}
                            className="relative flex flex-col p-4 px-6 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer gap-y-4"
                        >
                            {/* Player Name */}
                            <div className="text-2xl font-semibold">{player.user.name}</div>

                            {/* Player Team */}
                            <div className="text-lul-blue text-lg">
                                {player.seasonDetails[0]?.team?.name || 'Free Agent'}
                            </div>

                            {/* Jersey Number */}
                            <div className="absolute top-3 right-3 text-white text-2xl font-semibold uppercase">
                                {`#${player.seasonDetails[0]?.number}` || 'N/A'}
                            </div>

                            {/* Player Size */}
                            <div className="absolute bottom-3 right-3 text-lul-blue text-sm font-semibold uppercase">
                                {player.size}
                            </div>

                            {/* Total Stats */}
                            {player.totalStats && (
                                <div className="flex flex-col mt-2 gap-y-1 text-lul-light-grey text-sm">
                                    <p>
                                        Total Points: <span className="text-lul-green">{player.totalStats.points}</span>
                                    </p>
                                    <p>
                                        Total Assists: <span className="text-lul-green">{player.totalStats.assists}</span>
                                    </p>
                                    <p>
                                        Total Rebounds: <span className="text-lul-green">{player.totalStats.rebounds}</span>
                                    </p>
                                    <p>
                                        Games Played: <span className="text-lul-green">{player.totalStats.gamesPlayed}</span>
                                    </p>
                                </div>
                            )}

                            {/* Stats Averages */}
                            <div className="flex flex-col mt-2 gap-y-1 text-lul-light-grey text-sm">
                                <p>
                                    Avg. Points: <span className="text-lul-green">{statsAverage.points}</span>
                                </p>
                                <p>
                                    Avg. Assists: <span className="text-lul-green">{statsAverage.assists}</span>
                                </p>
                                <p>
                                    Avg. Rebounds: <span className="text-lul-green">{statsAverage.rebounds}</span>
                                </p>
                            </div>
                        </Link>
                    )
                })}
        </Grid>
    )
}
