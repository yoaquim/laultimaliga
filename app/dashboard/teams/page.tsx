import Link from 'next/link'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
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
                    className="relative flex flex-col h-full gap-y-6 p-4 pt-10 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer"
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

                    {/* Season ShortName or Name */}
                    <div className="absolute top-4 left-3 text-lul-blue text-sm font-bold uppercase">
                        {team.season.shortName || team.season.name}
                    </div>

                    {/* Team Logo */}
                    <div className="w-full flex justify-center items-center">
                        <img src={TEAM_LOGO_URL_BUILDER(team.logo)} alt="team-logo" className="h-32"/>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-center">
                        <p className="text-sm uppercase font-bold">Players</p>
                        <p className="text-sm uppercase font-bold">Played</p>
                        <p className="text-sm uppercase font-bold">Won</p>
                        <p className="text-2xl font-bold">{team.players.length}</p>
                        <p className="text-2xl font-bold text-lul-blue">{team.totalMatches}</p>
                        <p className="text-2xl font-bold text-lul-green">
                            {team.matchesWon}
                        </p>
                    </div>
                </Link>
            ))}
        </Grid>
    )
}
