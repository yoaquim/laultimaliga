import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function Page() {
    // Fetch teams data
    const teams = await prisma.team.findMany({
        where: {
            season: {
                isActive: true,
            },
        },
        include: {
            players: true,
            wins: true,
            homeMatches: true,
            awayMatches: true,
            season: true,
        },
    })

    // Calculate stats for each [teamId]
    const teamsWithStats = teams.map((team) => {
        const totalMatches = team.homeMatches.length + team.awayMatches.length
        const matchesWon = team.wins.length
        const winRate = totalMatches > 0 ? ((matchesWon / totalMatches) * 100).toFixed(2) : 'N/A'

        return {
            ...team,
            totalMatches,
            matchesWon,
            winRate,
        }
    })

    return (
        <div className="lg:mt-4 h-5/6 w-full p-6 mt-10 flex flex-col gap-y-8 bg-lul-black text-white overflow-y-scroll">
            {/* Sticky Header */}
            <div className="flex flex-col lg:flex-row lg:-top-6 items-center justify-between sticky -top-8 z-10 bg-lul-black p-4">
                <h1 className="text-3xl font-bold">Teams</h1>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {teamsWithStats
                    .sort((a, b) => b.matchesWon - a.matchesWon) // Sort by matches won
                    .map((team) => (
                        <Link
                            key={team.id}
                            href={`/dashboard/teams/${team.id}`}
                            className="p-4 bg-lul-grey/20 rounded-sm hover:bg-lul-grey/30 transition cursor-pointer"
                        >
                            {/* Team Name and Season */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="pr-8 text-2xl font-semibold border-b border-lul-blue">{team.name}</h2>
                                <p className="text-lul-blue">{team.season.name}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <p className="text-lg">Players</p>
                                    <p className="text-2xl font-bold">{team.players.length}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-lg">Matches Played</p>
                                    <p className="text-2xl font-bold">{team.totalMatches}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-lg">Matches Won</p>
                                    <p className="text-2xl font-bold text-lul-green">
                                        {team.matchesWon}
                                    </p>
                                </div>
                            </div>

                            {/* Win Rate */}
                            <div className="mt-4 text-center">
                                <p className="text-lg">Win Rate</p>
                                <p
                                    className={`text-2xl font-bold ${
                                        team.totalMatches === 0
                                            ? 'text-lul-red'
                                            : team.matchesWon / team.totalMatches > 0.5
                                                ? 'text-lul-green'
                                                : 'text-lul-yellow'
                                    }`}
                                >
                                    {team.winRate}%
                                </p>
                            </div>
                        </Link>
                    ))}
            </div>
        </div>
    )
}
