'use client'

import { Grid } from '@/ui/grid'
import { TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import Link from 'next/link'
import Score from '@/ui/score'
import { getPaginatedTeams } from '@/dashboard/teams/actions'
import { TeamWithStats } from '@/dashboard/teams/types'

// This page component uses the Grid to display paginated teams.
export default function Page() {
    // Define a function that fetches teams for the given page.
    const fetchTeams = async (page: number) => {
        const perPage = 20
        const {teams, total} = await getPaginatedTeams({page, perPage})
        return {data: teams, totalPages: Math.ceil(total / perPage)}
    }

    return (
        <Grid<TeamWithStats>
            title="Teams"
            fetchData={fetchTeams}
            renderItem={(team) => (
                <Link
                    key={team.id}
                    href={`/dashboard/teams/${team.id}`}
                    className="relative flex flex-col h-full gap-y-6 p-4 pt-10 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer"
                >
                    {/* Win Rate Badge - pinned at top-right */}
                    <div
                        className="absolute top-3 right-3 z-10 px-2.5 rounded-md text-white text-sm font-bold uppercase"
                        style={{backgroundColor: 'rgba(0,0,0,0.25)'}}
                    >
                        <div
                            className={
                                team.totalMatches > 0
                                    ? team.matchesWon / team.totalMatches <= 0.5
                                        ? 'text-lul-yellow'
                                        : 'text-lul-green'
                                    : 'text-lul-red'
                            }
                        >
                            <Score className="text-2xl" value={`${team.winRate}%`}/>
                        </div>
                    </div>

                    {/* Season Label (using shortName or name) */}
                    <div className="absolute top-4 left-3 text-lul-blue text-sm font-bold uppercase">
                        {team.season.shortName || team.season.name}
                    </div>

                    {/* Team Logo */}
                    <div className="w-full flex justify-center items-center">
                        <img
                            src={TEAM_LOGO_URL_BUILDER(team.logo)}
                            alt="team-logo"
                            className="h-32"
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-center">
                        <p className="text-sm uppercase font-bold">Players</p>
                        <p className="text-sm uppercase font-bold">Played</p>
                        <p className="text-sm uppercase font-bold">Won</p>
                        <Score className="text-4xl font-bold" value={team.players.length}/>
                        <Score
                            className="text-4xl font-bold text-lul-blue"
                            value={team.totalMatches}
                        />
                        <Score
                            className="text-4xl font-bold text-lul-green"
                            value={team.matchesWon}
                        />
                    </div>
                </Link>
            )}
        />
    )
}
