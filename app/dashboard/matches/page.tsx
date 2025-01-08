import { Prisma, PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { Grid } from '@/ui/grid'

type MatchWithTeams = Prisma.MatchGetPayload<{
    include: {
        season: true;
        homeTeam: true;
        awayTeam: true;
    };
}>;

const prisma = new PrismaClient()

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
            {matches
                .sort((match1: MatchWithTeams, match2: MatchWithTeams) => new Date(match1.date).getTime() - new Date(match2.date).getTime())
                .map((match) => (
                    <Link
                        key={match.id}
                        href={`/dashboard/matches/${match.id}`}
                        className="p-4 bg-lul-grey/20 rounded-sm hover:bg-lul-grey/30 transition cursor-pointer"
                    >
                        {/* Match Teams */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">
                                {match.homeTeam.name} vs {match.awayTeam.name}
                            </h2>
                            <p className="text-lul-blue">{match.season.name}</p>
                        </div>

                        {/* Match Date */}
                        <div className="text-center mb-4">
                            <p className="text-lg">Date</p>
                            <p className="text-2xl font-bold">{new Date(match.date).toLocaleDateString()}</p>
                        </div>

                        {/* Match Status */}
                        <div className="text-center">
                            <p className="text-lg">Status</p>
                            <p
                                className={`text-2xl font-bold ${
                                    match.status === 'SCHEDULED'
                                        ? 'text-lul-yellow'
                                        : match.status === 'ONGOING'
                                            ? 'text-lul-green'
                                            : match.status === 'COMPLETED'
                                                ? 'text-lul-blue'
                                                : 'text-lul-red'
                                }`}
                            >
                                {match.status}
                            </p>
                        </div>
                    </Link>
                ))}
        </Grid>
    )
}
