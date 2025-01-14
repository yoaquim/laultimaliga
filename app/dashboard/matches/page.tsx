import { Prisma } from '@prisma/client'
import Link from 'next/link'
import clsx from 'clsx'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import MatchCard from '@/ui/match-card'

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
            {sortedMatches.map((match) => (
                <MatchCard match={match} key={match.id}/>
            ))}
        </Grid>
    )
}
