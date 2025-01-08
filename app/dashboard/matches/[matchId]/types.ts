import { Match, PlayerMatchStats, Season, Team } from '@prisma/client'

export type StatType = 'points' | 'assists' | 'rebounds'

export interface MatchWithDetails extends Match {
    homeTeam: Team
    awayTeam: Team
    season: Season
    playerStats: PlayerMatchStats[]
}
