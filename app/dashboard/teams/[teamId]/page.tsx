import Link from 'next/link'
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
        <div className="h-full w-full pt-4 flex flex-col gap-y-8 text-white">
            {/* Team Header */}
            <div className="lg:bg-opacity-0 flex flex-col lg:flex-row pt-4 items-center justify-between sticky top-0 bg-lul-black z-10">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <p className="text-lul-blue uppercase font-bold">{team.season.shortName || team.season.name}</p>
            </div>

            {/*=====================================================*/}
            {/* TEAM STATS */}
            {/*=====================================================*/}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-lul-grey/20 py-4 rounded-md">
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
                <img src={TEAM_LOGO_URL_BUILDER(team.logo)} alt="team-logo" className="h-64"/>
            </div>

            {/*=====================================================*/}
            {/* PLAYERS & MATCHES */}
            {/*=====================================================*/}
            <div className="lg:flex-row lg:gap-x-8 w-full flex flex-col gap-y-6 flex-grow overflow-hidden">

                {/*-----------------------------------------------------*/}
                {/* PLAYERS */}
                {/*-----------------------------------------------------*/}
                <div className="w-full bg-lul-grey/20 p-4 rounded-md flex flex-col overflow-hidden">
                    <h2 className="text-2xl font-semibold border-b border-lul-blue pb-2">
                        Players
                    </h2>

                    <ul className="grid grid-cols-2 p-4 gap-y-4 gap-x-4  overflow-y-auto flex-grow">
                        {team.players.map((playerSeasonDetail: any) => (
                            <PlayerCard player={playerSeasonDetail.player} key={playerSeasonDetail.player.id}/>
                        ))}
                    </ul>
                </div>

                {/*-----------------------------------------------------*/}
                {/* MATCHES */}
                {/*-----------------------------------------------------*/}
                <div className="h-full w-full bg-lul-dark-grey p-4 rounded-md flex flex-col">
                    <h2 className="pb-2 text-2xl font-semibold border-b border-lul-blue">
                        Matches
                    </h2>

                    <div className="flex flex-col flex-grow overflow-y-scroll">
                        <div className="mt-4 flex flex-col">
                            <h3 className="py-2 font-semibold text-lul-yellow uppercase sticky top-0 bg-lul-dark-grey z-20">
                                Home Matches
                            </h3>
                            <ul className="grid grid-cols-2 p-4 gap-y-4 gap-x-4">
                                {team.homeMatches.map((match: any) => (
                                    <MatchCard match={match} key={match.id}/>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-10 flex flex-col">
                            <h3 className="py-2 font-semibold text-lul-yellow uppercase sticky top-0 bg-lul-dark-grey z-20">
                                Away Matches
                            </h3>
                            <ul className="grid grid-cols-2 p-4 gap-y-4 gap-x-4">
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
