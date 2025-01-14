import { Prisma } from '@prisma/client'
import { Grid } from '@/ui/grid'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import PlayerCard from '@/ui/player-card'

// --------------------------------------------------
// Types
// --------------------------------------------------
type PlayerWithDetails = Prisma.PlayerGetPayload<{
    include: {
        user: true
        seasonDetails: {
            include: {
                team: {
                    include: {
                        season: true
                    }
                }
            }
        }
        SeasonStats: true
    }
}>

export default async function Page() {
    // For bigger data sets, consider pagination
    const players: PlayerWithDetails[] = await prisma.player.findMany({
        include: {
            user: true,
            seasonDetails: {
                include: {
                    team: {
                        include: {season: true},
                    },
                },
            },
            // This is where we store each player's stats for different seasons
            SeasonStats: true,
        },
    })

    if (players.length === 0) {
        return (
            <Grid title="Players">
                <Empty message={EMPTY_MESSAGES.NO_PLAYERS}/>
            </Grid>
        )
    }

    return (
        <Grid title="Players">
            {players.map((player) => (
                <PlayerCard player={player} key={player.id}/>
            ))}
        </Grid>
    )
}
