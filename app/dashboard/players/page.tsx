import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

type PlayerWithDetails = Prisma.PlayerGetPayload<{
    include: {
        user: true
        team: {
            include: {
                season: true
            }
        }
        totalStats: true
    }
}>

export default async function Page() {
    const players: PlayerWithDetails[] = await prisma.player.findMany({
        include: {
            user: true,
            team: {
                include: {
                    season: true,
                },
            },
            totalStats: true,
        },
    })

    // Helper function to compute stats averages
    const calculateStatsAverage = (stats: PlayerWithDetails['totalStats']) => {
        if (!stats) return {points: 0, assists: 0, rebounds: 0, gamesPlayed: 0}
        const {points, assists, rebounds, gamesPlayed} = stats
        return {
            points: gamesPlayed > 0 ? (points / gamesPlayed).toFixed(1) : '0.0',
            assists: gamesPlayed > 0 ? (assists / gamesPlayed).toFixed(1) : '0.0',
            rebounds: gamesPlayed > 0 ? (rebounds / gamesPlayed).toFixed(1) : '0.0',
        }
    }

    return (
        <Grid title="Players">
            {players.length === 0 && <Empty message={EMPTY_MESSAGES.NO_PLAYERS}/>}
            {players.length > 0 &&
                players.map((player) => {
                    const statsAverage = calculateStatsAverage(player.totalStats)

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
                                {player.team?.name || 'Free Agent'}
                            </div>

                            {/* Jersey Number */}
                            <div className="absolute top-3 right-3 text-white text-2xl font-semibold uppercase">
                                #{player.number}
                            </div>

                            {/* Player Size */}
                            <div className="absolute bottom-3 right-3 text-lul-blue text-sm font-semibold uppercase">
                                {player.size}
                            </div>

                            {/* Stats Averages */}
                            <div className="flex flex-col mt-2 gap-y-1 text-lul-light-grey text-sm">
                                <p>
                                    Points: <span className="text-lul-green">{statsAverage.points}</span>
                                </p>
                                <p>
                                    Assists: <span className="text-lul-green">{statsAverage.assists}</span>
                                </p>
                                <p>
                                    Rebounds: <span className="text-lul-green">{statsAverage.rebounds}</span>
                                </p>
                            </div>
                        </Link>
                    )
                })}
        </Grid>
    )
}
