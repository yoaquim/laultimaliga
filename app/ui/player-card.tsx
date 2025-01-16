import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { BUCKET_ENDPOINT, DEFAULT_PROFILE_PIC_BUILDER } from '@/lib/utils'
import Score from '@/ui/score'

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


interface Props {
    player: PlayerWithDetails
}

export default function PlayerCard({player}: Props) {
    // Grab the player's first seasonDetail (if any)
    const firstDetail = player.seasonDetails[0]
    const seasonId = firstDetail?.team?.season?.id
    const shortName =
        firstDetail?.team?.season?.shortName ||
        firstDetail?.team?.season?.name ||
        'N/A'

    // Find the matching seasonStats for that season
    const seasonStats = player.SeasonStats.find(
        (stat: any) => stat.seasonId === seasonId
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
            className="relative items-stretch flex flex-col h-full gap-y-4 p-4 pb-3 px-5 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer">

            {/* TOP SECTION */}
            <div className="w-full flex flex-col itemscenter text-white max-w-60 lg:max-w-full">
                {/* PLAYER NAME */}
                <div className="w-full flex-grow text-2xl font-semibold max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-full">
                    {player.user.name}
                </div>

                {/* PLAYER TEAM */}
                <div className="text-lul-yellow uppercase font-bold text-sm">
                    {firstDetail?.team?.name ?? 'Free Agent'}
                </div>
            </div>

            {/* PLAYER NUMBER */}
            <div className="absolute top-1 right-4 flex self-end items-end">
                <Score className="text-3xl font-bold uppercase" value={firstDetail?.number ? `#` : ''}/>
                <Score className="text-5xl font-bold uppercase" value={firstDetail?.number ? `${firstDetail.number}` : 'N/A'}/>
            </div>

            {/* BOTTOM SECTION */}
            <div className="mt-auto pt-2 flex items-center">
                {/* IMAGE */}
                <div className="w-1/2 text-center">
                    <img
                        className="h-24 mx-auto rounded-md"
                        src={
                            player.user.image
                                ? `${BUCKET_ENDPOINT}/players/${player.user.image}`
                                : DEFAULT_PROFILE_PIC_BUILDER(player.user.name)
                        }
                        alt="user-image"/>
                </div>

                {/* STATS */}
                <div className="-mt-4 w-1/2 grid grid-cols-3 text-lul-light-grey text-xl font-bold">
                    <div></div>
                    <div className="flex items-end justify-end text-sm">ALL</div>
                    <div className="flex items-end justify-end text-sm">AVG</div>

                    <div className="flex items-end justify-end text-white text-base">PTS</div>
                    <Score className="flex leading-none text-3xl items-end justify-end text-lul-green" value={points}/>
                    <Score className="flex leading-none text-3xl items-end justify-end text-lul-blue" value={avgPoints}/>

                    <div className="flex items-end justify-end text-white text-base">AST</div>
                    <Score className="flex leading-none text-3xl items-end justify-end text-lul-green" value={assists}/>
                    <Score className="flex leading-none text-3xl items-end justify-end text-lul-blue" value={avgAssists}/>

                    <div className="flex items-end justify-end text-white text-base">REB</div>
                    <Score className="flex leading-none text-3xl items-end justify-end text-lul-green" value={rebounds}/>
                    <Score className="flex leading-none text-3xl items-end justify-end text-lul-blue" value={avgRebounds}/>
                </div>
            </div>


            {/* SEASON*/}
            <div className="mt-auto flex justify-end text-lul-blue text-sm font-semibold uppercase">
                {/* Season shortName (or name) */}
                <div>{shortName}</div>
            </div>
        </Link>
    )
}