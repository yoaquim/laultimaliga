import { PrismaClient } from '@prisma/client'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'


export default async function TeamDetailsPage({params}: { params: Promise<{ teamId: string }> }) {
    const {teamId} = await params

    // Fetch team details, players, matches, and stats
    const team = await prisma.team.findUnique({
        where: {id: teamId},
        include: {
            players: {
                include: {
                    user: true,
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
        <div className="lg:mt-4 w-full h-full p-6 pb-10 mt-10 flex flex-col gap-y-8 text-white overflow-y-scroll">
            {/* Team Header */}
            <div className="flex flex-col lg:flex-row items-center justify-between">
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <p className="text-lul-blue text-lg">Season: {team.season.name}</p>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-lul-grey/20 p-4 rounded-md">
                <div className="flex flex-col items-center">
                    <p className="text-lg">Total Matches</p>
                    <p className="text-2xl font-bold">{totalMatches}</p>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-lg">Matches Won</p>
                    <p className="text-2xl font-bold text-lul-green">{matchesWon}</p>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-lg">Win Rate</p>
                    <p className="text-2xl font-bold">{winRate}%</p>
                </div>
            </div>

            {/* Players & Matches */}
            <div className="lg:flex-row lg:justify-between lg:gap-x-8 w-full h-full flex flex-col gap-y-6 ">

                {/* Players List */}
                <div className="w-full h-full bg-lul-grey/20 p-4 rounded-md overflow-y-scroll">
                    <h2 className="text-2xl font-semibold border-b border-lul-blue pb-2">Players</h2>
                    <ul className="mt-4 space-y-2">
                        {team.players.map((player) => (
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
                <div className="w-full h-full bg-lul-grey/20 p-4 rounded-md overflow-y-scroll">
                    <h2 className="text-2xl font-semibold border-b border-lul-blue pb-2">Matches</h2>

                    <div className="mt-4">
                        <h3 className="font-semibold text-lul-light-grey uppercase">Home Matches</h3>
                        <ul className="mt-2 space-y-2">
                            {team.homeMatches.map((match) => (
                                <li
                                    key={match.id}
                                    className="flex justify-between items-center p-2 bg-lul-grey/10 rounded hover:bg-lul-grey/20 transition cursor-pointer"
                                >
                                    <p>
                                        <span className="text-lul-blue">{team.name}</span> ⚡{' '}
                                        {match.awayTeam.name}
                                    </p>
                                    <p className="text-lul-light-grey">
                                        {new Date(match.date).toLocaleDateString()}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-10">
                        <h3 className="font-semibold text-lul-light-grey uppercase">Away Matches</h3>
                        <ul className="mt-2 space-y-2">
                            {team.awayMatches.map((match) => (
                                <li
                                    key={match.id}
                                    className="flex justify-between items-center p-2 bg-lul-grey/10 rounded hover:bg-lul-grey/20 transition"
                                >
                                    <p>
                                        {match.homeTeam.name} ⚡{' '}
                                        <span className="text-lul-blue">{team.name}</span>
                                    </p>
                                    <p className="text-lul-light-grey">
                                        {new Date(match.date).toLocaleDateString()}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
