import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { BUCKET_ENDPOINT, EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

// --------------------------------------------------
// Types
// --------------------------------------------------
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
        SeasonStats: true
    }
}>

export default async function Page() {
    // For bigger data sets, consider pagination
    const players: PlayerWithDetails[] = await prisma.player.findMany({
        include: {
            user: true,
            seasonDetails: {
                include: {
                    team: {
                        include: {season: true},
                    },
                },
            },
            // This is where we store each player's stats for different seasons
            SeasonStats: true,
        },
    })

    if (players.length === 0) {
        return (
            <Grid title="Players">
                <Empty message={EMPTY_MESSAGES.NO_PLAYERS}/>
            </Grid>
        )
    }

    return (
        <Grid title="Players">
            {players.map((player) => {
                // Grab the player's first seasonDetail (if any)
                const firstDetail = player.seasonDetails[0]
                const seasonId = firstDetail?.team?.season?.id
                const shortName =
                    firstDetail?.team?.season?.shortName ||
                    firstDetail?.team?.season?.name ||
                    'N/A'

                // Find the matching seasonStats for that season
                const seasonStats = player.SeasonStats.find(
                    (stat) => stat.seasonId === seasonId
                )
                const {points, assists, rebounds, gamesPlayed} = seasonStats || {
                    points: 0,
                    assists: 0,
                    rebounds: 0,
                    gamesPlayed: 0,
                }

                // Compute averages
                const avgPoints =
                    gamesPlayed > 0 ? (points / gamesPlayed).toFixed(1) : '0.0'
                const avgAssists =
                    gamesPlayed > 0 ? (assists / gamesPlayed).toFixed(1) : '0.0'
                const avgRebounds =
                    gamesPlayed > 0 ? (rebounds / gamesPlayed).toFixed(1) : '0.0'

                return (
                    <Link
                        key={player.id}
                        href={`/dashboard/players/${player.id}`}
                        className="items-stretch flex flex-col h-full gap-y-4 p-4 px-5 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer">

                        {/* TOP SECTION */}
                        <div className="flex flex-col gap-y-2">
                            {/* Player Name & Jersey Number */}
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-x-4 text-white">
                                    <div className="flex-grow text-2xl font-semibold">
                                        {player.user.name}
                                    </div>
                                    <div className="text-4xl font-bold uppercase">
                                        {firstDetail?.number ? `#${firstDetail.number}` : 'N/A'}
                                    </div>
                                </div>

                                {/* Player Team */}
                                <div className="text-lul-blue uppercase font-bold text-sm">
                                    {firstDetail?.team?.name ?? 'Free Agent'}
                                </div>
                            </div>
                        </div>

                        {/* IMAGE */}

                        <div className="mt-auto flex items-center">
                            <div className="w-1/2 flex items-center">
                                <img
                                    className="h-24 rounded-full"
                                    src={
                                        player.user.image
                                            ? `${BUCKET_ENDPOINT}/players/${player.user.image}`
                                            : `https://ui-avatars.com/api/?name=${player.user.name}`
                                    }
                                    alt="user-image"/>
                            </div>

                            {/* STATS */}
                            <div className="-mt-4 w-1/2 grid grid-cols-3 text-lul-light-grey text-xl font-bold">
                                <div></div>
                                <div className="flex items-end justify-end text-sm">ALL</div>
                                <div className="flex items-end justify-end text-sm">AVG</div>

                                <div className="flex items-end justify-start text-white text-base">PTS</div>
                                <div className="flex items-end justify-end text-lul-green">{points}</div>
                                <div className="flex items-end justify-end text-lul-blue ">{avgPoints}</div>

                                <div className="flex items-end justify-start text-white text-base">AST</div>
                                <div className="flex items-end justify-end text-lul-green">{assists}</div>
                                <div className="flex items-end justify-end text-lul-blue ">{avgAssists}</div>

                                <div className="flex items-end justify-start text-white text-base">REB</div>
                                <div className="flex items-end justify-end text-lul-green">{rebounds}</div>
                                <div className="flex items-end justify-end text-lul-blue ">{avgRebounds}</div>
                            </div>
                        </div>


                        {/* SEASON*/}
                        <div className="mt-auto flex justify-end text-lul-yellow text-sm font-semibold uppercase">
                            {/* Season shortName (or name) */}
                            <div>{shortName}</div>
                        </div>
                    </Link>
                )
            })}
        </Grid>
    )
}
