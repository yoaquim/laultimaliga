import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { EMPTY_MESSAGES } from '@/lib/utils'
import Empty from '@/ui/empty'

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
                        },
                    },
                },
            },
            homeMatches: {
                include: {
                    awayTeam: true,
                },
            },
            awayMatches: {
                include: {
                    homeTeam: true,
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
        <div className="lg:mt-4 lg:pt-6 w-full mt-10 flex flex-col gap-y-8 text-white">
            {/* Team Header */}
            <div className="lg:bg-opacity-0 flex flex-col lg:flex-row pt-4 items-center justify-between sticky top-0 bg-lul-black z-10">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <p className="text-lul-blue uppercase font-bold">Season: {team.season.name}</p>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-lul-grey/20 p-4 rounded-md">
                <div className="flex flex-col items-center gap-y-2">
                    <p className="text-sm uppercase font-bold">Total Matches</p>
                    <p className="text-3xl font-bold">{totalMatches}</p>
                </div>
                <div className="flex flex-col items-center gap-y-2">
                    <p className="text-sm uppercase font-bold">Matches Won</p>
                    <p className="text-3xl font-bold text-lul-green">{matchesWon}</p>
                </div>
                <div className="flex flex-col items-center gap-y-2">
                    <p className="text-sm uppercase font-bold">Win Rate</p>
                    <p className="text-3xl font-bold">{winRate}%</p>
                </div>
            </div>

            {/* Players & Matches */}
            <div className="lg:flex-row lg:gap-x-8 w-full flex flex-col gap-y-6 flex-grow overflow-hidden">
                {/* Players List */}
                <div className="w-full bg-lul-grey/20 p-4 rounded-md flex flex-col overflow-hidden">
                    <h2 className="text-2xl font-semibold border-b border-lul-blue pb-2">
                        Players
                    </h2>
                    <ul className="mt-4 space-y-2 overflow-y-auto flex-grow">
                        {team.players.map((player: any) => (
                            <li
                                key={player.id}
                                className="flex justify-between items-center p-2 bg-lul-grey/10 rounded hover:bg-lul-grey/20 transition cursor-pointer"
                            >
                                <p>{player.user.name}</p>
                                <p className="text-lul-light-grey">#{player.number}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Matches */}
                <div className="w-full bg-lul-grey/20 p-4 rounded-md flex flex-col overflow-hidden">
                    <h2 className="text-2xl font-semibold border-b border-lul-blue pb-2bg-lul-dark-grey">
                        Matches
                    </h2>
                    <div className="flex flex-col flex-grow overflow-hidden">

                        <div className="mt-4 flex flex-col flex-grow overflow-y-scroll">
                            <h3 className=" font-semibold text-lul-light-grey uppercase sticky top-0">
                                Home Matches
                            </h3>
                            <ul className="mt-2 space-y-2 overflow-y-auto">
                                {team.homeMatches.map((match) => (
                                    <Link
                                        key={match.id}
                                        href={`/dashboard/matches/${match.id}`}
                                        className="flex justify-between items-center p-2 bg-lul-grey/10 rounded hover:bg-lul-grey/20 transition cursor-pointer"
                                    >
                                        <p>
                                            <span className="text-lul-blue">{team.name}</span> ⚡{' '}
                                            {match.awayTeam.name}
                                        </p>
                                        <p className="text-lul-light-grey">
                                            {new Date(match.date).toLocaleDateString()}
                                        </p>
                                    </Link>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-10 flex flex-col flex-grow overflow-y-scroll">
                            <h3 className="font-semibold text-lul-light-grey uppercase sticky top-0">
                                Away Matches
                            </h3>
                            <ul className="mt-2 space-y-2 overflow-y-auto">
                                {team.awayMatches.map((match) => (
                                    <Link
                                        key={match.id}
                                        href={`/dashboard/matches/${match.id}`}
                                        className="flex justify-between items-center p-2 bg-lul-grey/10 rounded hover:bg-lul-grey/20 transition"
                                    >
                                        <p>
                                            {match.homeTeam.name} ⚡{' '}
                                            <span className="text-lul-blue">{team.name}</span>
                                        </p>
                                        <p className="text-lul-light-grey">
                                            {new Date(match.date).toLocaleDateString()}
                                        </p>
                                    </Link>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
