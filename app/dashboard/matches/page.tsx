import { Prisma } from '@prisma/client'
import Link from 'next/link'
import clsx from 'clsx'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

type MatchWithTeams = Prisma.MatchGetPayload<{
    include: {
        season: true
        homeTeam: true
        awayTeam: true
    }
}>

export default async function Page() {
    const matches: MatchWithTeams[] = await prisma.match.findMany({
        where: {
            season: {isActive: true},
        },
        include: {
            season: true,
            homeTeam: true,
            awayTeam: true,
        },
    })

    if (matches.length === 0) {
        return (
            <Grid title="Matches">
                <Empty message={EMPTY_MESSAGES.NO_MATCHES}/>
            </Grid>
        )
    }

    const sortedMatches = matches.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return (
        <Grid title="Matches">
            {sortedMatches.map((match) => {
                const dateStr = new Date(match.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })

                // Show scoreboard if Ongoing or Completed
                const isScoreVisible =
                    match.status === 'ONGOING' || match.status === 'COMPLETED'
                // We'll color the scoreboard green if ONGOING, blue if COMPLETED
                const scoreColor =
                    match.status === 'ONGOING' ? 'text-lul-green' : 'text-lul-blue'

                return (
                    <Link
                        key={match.id}
                        href={`/dashboard/matches/${match.id}`}
                        className="relative flex flex-col h-full gap-y-8 p-6 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer"
                    >
                        {/* STATUS BADGE - pinned top-right */}
                        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-md text-white text-sm font-bold uppercase" style={{backgroundColor: 'rgba(0,0,0,0.25)'}}>
                            <div className={clsx({
                                'text-lul-yellow': match.status === 'SCHEDULED',
                                'text-lul-green': match.status === 'ONGOING',
                                'text-lul-blue': match.status === 'COMPLETED',
                                'text-lul-red': match.status === 'CANCELED',
                            })}
                            >
                                {match.status}
                            </div>
                        </div>

                        {/* MAIN CONTENT */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-y-4 pt-8">
                            {/* TEAMS */}
                            <div className="flex flex-col items-center space-y-2">
                                <div className="text-2xl font-semibold text-white break-words text-center">
                                    {match.homeTeam.name}
                                </div>

                                {/* If not showing score, use ⚡️ or something else */}
                                {isScoreVisible ? (
                                    <div className={clsx('text-3xl font-bold', scoreColor)}>
                                        {match.homeScore} - {match.awayScore}
                                    </div>
                                ) : (
                                    <div className="text-3xl text-white opacity-80">⚡️</div>
                                )}

                                <div className="text-2xl font-semibold text-white break-words text-center">
                                    {match.awayTeam.name}
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM ROW (DATE & SEASON) */}
                        <div className="flex justify-between items-center">
                            <div className="text-white font-bold text-sm">{dateStr}</div>
                            <div className="text-lul-orange text-sm font-semibold uppercase">
                                {match.season.shortName || match.season.name}
                            </div>
                        </div>
                    </Link>
                )
            })}
        </Grid>
    )
}
