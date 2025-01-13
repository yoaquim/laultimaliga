import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import clsx from 'clsx'

export default async function Page() {
    const teams = await prisma.team.findMany({
        where: {
            season: {
                isActive: true,
            },
        },
        include: {
            players: true,
            wins: true,       // matches that this team has won
            homeMatches: true,
            awayMatches: true,
            season: true,
        },
    })

    if (teams.length === 0) {
        return (
            <Grid title="Teams">
                <Empty message={EMPTY_MESSAGES.NO_TEAMS}/>
            </Grid>
        )
    }

    // Calculate stats for each team
    const teamsWithStats = teams.map((team) => {
        const totalMatches = team.homeMatches.length + team.awayMatches.length
        const matchesWon = team.wins.length
        const winRate = totalMatches
            ? ((matchesWon / totalMatches) * 100).toFixed(2)
            : 'N/A'

        return {
            ...team,
            totalMatches,
            matchesWon,
            winRate,
        }
    })

    // Sort by matches won descending
    const sortedTeams = teamsWithStats.sort(
        (a, b) => b.matchesWon - a.matchesWon
    )

    return (
        <Grid title="Teams">
            {sortedTeams.map((team) => (
                <Link
                    key={team.id}
                    href={`/dashboard/teams/${team.id}`}
                    className="relative flex flex-col h-full gap-y-6 p-4 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer"
                >
                    {/* Win Rate - pinned top-right */}
                    <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-md text-white text-sm font-bold uppercase" style={{backgroundColor: 'rgba(0,0,0,0.25)'}}>
                        <div className={clsx({
                            'text-lul-yellow': team.matchesWon / team.totalMatches <= 0.5,
                            'text-lul-green': team.matchesWon / team.totalMatches > 0.5,
                            'text-lul-red': team.totalMatches === 0,
                        })}
                        >
                            {team.winRate}%
                        </div>
                    </div>

                    {/* TOP SECTION */}
                    <div className="flex-1 flex flex-col">
                        {/* Team Name */}
                        <div className="flex items-center justify-between mb-4 w-5/6">
                            <h2 className="pr-8 text-3xl font-semibold">{team.name}</h2>
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
                    </div>

                    {/* Season ShortName or Name */}
                    <div className="self-end text-lul-blue text-sm font-semibold uppercase">
                        {team.season.shortName || team.season.name}
                    </div>
                </Link>
            ))}
        </Grid>
    )
}
