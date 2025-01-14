import { prisma } from '@/lib/prisma'
import { EMPTY_MESSAGES, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import Empty from '@/ui/empty'
import PlayerCard from '@/ui/player-card'
import MatchCard from '@/ui/match-card'
import clsx from 'clsx'

export default async function Page({params}: { params: Promise<{ teamId: string }> }) {
    const {teamId} = await params

    // Fetch team details, players, matches, and stats
    const team = await prisma.team.findUnique({
        where: {id: teamId},
        include: {
            players: {
                include: {
                    player: {
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
                            SeasonStats: true,
                        },
                    },
                },
            },
            homeMatches: {
                include: {
                    season: true,
                    awayTeam: true,
                    homeTeam: true,
                },
            },
            awayMatches: {
                include: {
                    season: true,
                    homeTeam: true,
                    awayTeam: true,
                },
            },
            season: true,
            wins: true,
        },
    })

    if (!team) return <Empty message={EMPTY_MESSAGES.TEAM_DOES_NOT_EXIST}/>

    const totalMatches = team.homeMatches.length + team.awayMatches.length
    const matchesWon = team.wins.length
    const winRate = totalMatches > 0 ? ((matchesWon / totalMatches) * 100).toFixed(2) : 'N/A'

    return (
        <div className="h-full w-full pt-4 flex flex-col gap-y-8 text-white overflow-y-scroll">
            {/*=====================================================*/}
            {/* TEAM STATS */}
            {/*=====================================================*/}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-lul-grey/20 py-4 rounded-md">
                <div className="flex flex-col items-center gap-y-1">
                    <p className="text-sm uppercase font-bold">Season</p>
                    <p className="text-3xl font-bold text-lul-blue">{team.season.shortName || team.season.name}</p>
                </div>
                <div className="flex flex-col items-center gap-y-1">
                    <p className="text-sm uppercase font-bold">Total Matches</p>
                    <p className="text-3xl font-bold">{totalMatches}</p>
                </div>
                <div className="flex flex-col items-center gap-y-1">
                    <p className="text-sm uppercase font-bold">Matches Won</p>
                    <p className="text-3xl font-bold text-lul-green">{matchesWon}</p>
                </div>
                <div className="flex flex-col items-center gap-y-1">
                    <p className="text-sm uppercase font-bold">Win Rate</p>
                    <p className={clsx('text-3xl font-bold', {
                        'text-lul-yellow': matchesWon / totalMatches <= 0.5,
                        'text-lul-green': matchesWon / totalMatches > 0.5,
                        'text-lul-red': totalMatches === 0,
                    })}>{winRate}%</p>
                </div>
            </div>

            {/*=====================================================*/}
            {/* LOGO */}
            {/*=====================================================*/}
            <div className="w-full flex justify-center items-center">
                <img src={TEAM_LOGO_URL_BUILDER(team.logo)} alt="team-logo" className="lg:h-64 h-40"/>
            </div>

            {/*=====================================================*/}
            {/* PLAYERS & MATCHES */}
            {/*=====================================================*/}
            <div className="h-full lg:flex-row lg:gap-x-8 w-full flex flex-col gap-y-6 flex-grow lg:overflow-hidden">

                {/*-----------------------------------------------------*/}
                {/* PLAYERS */}
                {/*-----------------------------------------------------*/}
                <div className="lg:h-full h-fit w-full bg-lul-dark-grey p-4 rounded-md flex flex-col">
                    <h2 className="text-2xl font-semibold bg-lul-dark-grey border-b border-lul-blue pb-2 sticky -top-4 z-20">
                        Players
                    </h2>

                    <ul className="h-full grid xl:grid-cols-2 grid-cols-1 lg:px-4 py-4 gap-y-4 gap-x-4 lg:overflow-y-scroll">
                        {team.players.map((playerSeasonDetail: any) => (
                            <PlayerCard player={playerSeasonDetail.player} key={playerSeasonDetail.player.id}/>
                        ))}
                    </ul>
                </div>

                {/*-----------------------------------------------------*/}
                {/* MATCHES */}
                {/*-----------------------------------------------------*/}
                <div className="lg:h-full h-fit w-full bg-lul-dark-grey p-4 rounded-md flex flex-col">
                    <h2 className="pb-2 text-2xl font-semibold bg-lul-dark-grey border-b border-lul-blue sticky -top-4 z-20">
                        Matches
                    </h2>

                    <div className="flex flex-col flex-grow lg:overflow-y-scroll">
                        <div className="mt-4 flex flex-col">
                            <h3 className="py-2 font-semibold text-lul-yellow uppercase sticky lg:top-0 top-6 bg-lul-dark-grey z-20">
                                Home Matches
                            </h3>
                            <ul className="grid xl:grid-cols-2 grid-cols-1 lg:px-4 py-4 gap-y-4 gap-x-4">
                                {team.homeMatches.map((match: any) => (
                                    <MatchCard match={match} key={match.id}/>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-10 flex flex-col">
                            <h3 className="py-2 font-semibold text-lul-yellow uppercase sticky lg:top-0 top-6 bg-lul-dark-grey z-20">
                                Away Matches
                            </h3>
                            <ul className="grid xl:grid-cols-2 grid-cols-1 lg:px-4 py-4 gap-y-4 gap-x-4">
                                {team.awayMatches.map((match: any) => (
                                    <MatchCard match={match} key={match.id}/>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
