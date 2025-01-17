'use client'

import { Grid } from '@/ui/grid'
import { getPaginatedPlayers } from '@/dashboard/players/actions'
import { PlayerWithDetails } from '@/dashboard/players/types'
import PlayerCard from '@/ui/player-card'

export default function Page() {
    const fetchPlayers = async (page: number) => {
        const perPage = 20
        const {players, total} = await getPaginatedPlayers({page, perPage})
        return {data: players, totalPages: Math.ceil(total / perPage)}
    }

    return (
        <Grid<PlayerWithDetails>
            title="Players"
            fetchData={fetchPlayers}
            renderItem={(player) => <PlayerCard player={player} key={player.id}/>}/>
    )
}