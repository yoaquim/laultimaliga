import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
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
                        className="
              flex flex-col h-full gap-y-8
              p-4 px-5
              bg-lul-grey/20
              rounded-md
              hover:bg-lul-grey/30
              transition
              cursor-pointer
            "
                    >
                        {/* TOP SECTION */}
                        <div className="flex-1 flex flex-col gap-y-2">
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

                        {/* Stats */}
                        <div className="flex flex-col text-lul-light-grey text-sm">
                            <div className="flex justify-around gap-x-6 uppercase font-bold text-center">
                                {/* PTS */}
                                <div className="flex flex-col items-center">
                                    <div className="text-white text-base mb-1">PTS</div>
                                    <div className="flex gap-x-4">
                                        {/* TOTAL */}
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs">ALL</div>
                                            <div className="text-lul-green text-lg">{points}</div>
                                        </div>
                                        {/* AVG */}
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs">AVG</div>
                                            <div className="text-lul-blue text-lg">{avgPoints}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* AST */}
                                <div className="flex flex-col items-center">
                                    <div className="text-white text-base mb-1">AST</div>
                                    <div className="flex gap-x-4">
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs">ALL</div>
                                            <div className="text-lul-green text-lg">
                                                {assists}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs">AVG</div>
                                            <div className="text-lul-blue text-lg">
                                                {avgAssists}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* REB */}
                                <div className="flex flex-col items-center">
                                    <div className="text-white text-base mb-1">REB</div>
                                    <div className="flex gap-x-4">
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs">ALL</div>
                                            <div className="text-lul-green text-lg">
                                                {rebounds}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs">AVG</div>
                                            <div className="text-lul-blue text-lg">
                                                {avgRebounds}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* BOTTOM ROW (Season & Size) pinned at bottom */}
                        <div className="flex justify-end text-lul-yellow text-sm font-semibold uppercase">
                            {/* Season shortName (or name) */}
                            <div>{shortName}</div>
                        </div>
                    </Link>
                )
            })}
        </Grid>
    )
}
