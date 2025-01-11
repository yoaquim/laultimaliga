import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'
import clsx from 'clsx'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

type MatchWithTeams = Prisma.MatchGetPayload<{
    include: {
        season: true;
        homeTeam: true;
        awayTeam: true;
    };
}>;

export default async function Page() {
    const matches: MatchWithTeams[] = await prisma.match.findMany({
        where: {
            season: {
                isActive: true,
            },
        },
        include: {
            season: true,
            homeTeam: true,
            awayTeam: true,
        },
    })

    return (
        <Grid title="Matches">
            {matches.length === 0 && <Empty message={EMPTY_MESSAGES.NO_MATCHES}/>}
            {matches.length > 0 && matches
                .sort((match1: MatchWithTeams, match2: MatchWithTeams) => new Date(match1.date).getTime() - new Date(match2.date).getTime())
                .map((match) => {
                    const date = new Date(match.date).toLocaleDateString('en-US', {month: 'long', year: 'numeric', day: 'numeric'})
                    return (
                        <Link
                            key={match.id}
                            href={`/dashboard/matches/${match.id}`}
                            className="relative flex flex-col p-4 px-6 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer gap-y-8"
                        >
                            {/* Match Teams */}
                            <div className="grid grid-cols-3 text-2xl font-semibold gap-x-2">
                                <div>{match.homeTeam.name}</div>
                                <div className="pt-4 text-center text-4xl">⚡️</div>
                                <div className="text-right">{match.awayTeam.name}</div>
                            </div>

                            {/* Match Status */}
                            <div className="flex flex-col items-center gap-y-2">
                                <h1
                                    className={clsx('text-2xl font-bold',
                                        {
                                            'text-lul-yellow': match.status === 'SCHEDULED',
                                            'text-lul-green': match.status === 'ONGOING',
                                            'text-lul-blue': match.status === 'COMPLETED',
                                            'text-lul-red': match.status === 'CANCELED',
                                        })}
                                >
                                    {match.status}
                                </h1>

                                {/* Match Date */}
                                <h1 className="font-bold text-center">{date}</h1>
                            </div>

                            <div className="absolute bottom-2 right-2 text-lul-blue text-sm font-semibold uppercase">
                                {match.season.shortName
                                    ? match.season.shortName
                                    : match.season.name
                                }
                            </div>
                        </Link>
                    )
                })}
        </Grid>
    )
}
