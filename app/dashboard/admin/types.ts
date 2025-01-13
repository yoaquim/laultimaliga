type AdminTab = 'SEASONS' | 'TEAMS' | 'PLAYERS' | 'MATCHES';
type SECSchemaType = SeasonsSchemaType | TeamsSchemaType | PlayersSchemaType | MatchesSchemaType

interface SeasonsSchemaType {
    name: string
    shortName: string
    startDate: string
    endDate: string
}

interface TeamsSchemaType {
    name: string
    seasonId: string
}

interface PlayersSchemaType {
    name: string
    phone: string
    size: string
}

interface MatchesSchemaType {
    homeTeamId: string
    awayTeamId: string
    seasonId: string
    date: string
}