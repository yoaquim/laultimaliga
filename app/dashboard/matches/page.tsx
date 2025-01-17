'use client'

import { Grid } from '@/ui/grid'
import MatchCard from '@/ui/match-card'
import { MatchWithTeams } from '@/dashboard/matches/types'
import { getPaginatedMatches } from '@/dashboard/matches/actions'

export default function Page() {

    const fetchMatches = async (page: number) => {
        const perPage = 20
        const {matches, total} = await getPaginatedMatches({page, perPage})
        const sortedMatches = matches
            .sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            )
        return {data: sortedMatches, totalPages: Math.ceil(total / perPage)}
    }

    return (
        <Grid<MatchWithTeams>
            title="Matches"
            fetchData={fetchMatches}
            renderItem={(match: MatchWithTeams) => (
                <MatchCard match={match} key={match.id}/>
            )}/>
    )
}
