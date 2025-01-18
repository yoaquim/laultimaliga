'use client'

import { getPaginatedPlayers } from '@/dashboard/players/actions'
import { PlayerWithDetails } from '@/dashboard/players/types'
import PlayerCard from '@/ui/player-card'
import { SeasonFilteredGrid } from '@/ui/season-filtered-grid'

export default function Page() {
    const fetchPlayers = async (page: number, seasonId: string) => {
        const perPage = 20
        const {players, total} = await getPaginatedPlayers({page, perPage, seasonId})
        return {data: players, totalPages: Math.ceil(total / perPage)}
    }

    return (
        <SeasonFilteredGrid<PlayerWithDetails>
            title="Players"
            fetchData={fetchPlayers}
            renderItem={(player) => <PlayerCard player={player} key={player.id}/>}/>
    )
}