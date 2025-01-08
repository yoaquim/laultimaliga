import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'

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
        <Grid title="Teams">
            {teamsWithStats
                .sort((a, b) => b.matchesWon - a.matchesWon) // Sort by matches won
                .map((team) => (
                    <Link
                        key={team.id}
                        href={`/dashboard/teams/${team.id}`}
                        className="relative px-4 py-6 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer"
                    >
                        {/* Team Name and Win Rate */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="pr-8 text-2xl font-semibold ">{team.name}</h2>

                            <div className={`font-bold text-lg ${
                                team.totalMatches === 0
                                    ? 'text-lul-red'
                                    : team.matchesWon / team.totalMatches > 0.5
                                        ? 'text-lul-green'
                                        : 'text-lul-yellow'
                            }`}
                            >
                                {team.winRate}%
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <p className="text-lg">Players</p>
                            <p className="text-lg">Played</p>
                            <p className="text-lg">Won</p>
                            <p className="text-2xl font-bold">{team.players.length}</p>
                            <p className="text-2xl font-bold">{team.totalMatches}</p>
                            <p className="text-2xl font-bold text-lul-green">
                                {team.matchesWon}
                            </p>
                        </div>


                        {/* Season */
                        }
                        <div className="absolute bottom-2 right-2 text-lul-blue text-sm font-semibold uppercase">
                            {team.season.shortName
                                ? team.season.shortName
                                : team.season.name
                            }
                        </div>
                    </Link>
                ))
            }
        </Grid>
    )
}
