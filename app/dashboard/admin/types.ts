type AdminTab =
    | 'SEASONS'
    | 'TEAMS'
    | 'PLAYERS'
    | 'MATCHES'
    | 'PSDETAILS'
    | 'PARTICIPATIONS';

type SECSchemaType =
    | SeasonsSchemaType
    | TeamsSchemaType
    | PlayersSchemaType
    | MatchesSchemaType
    | PSDetailsSchemaType
    | ParticipationsSchemaType

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

interface PSDetailsSchemaType {
    playerId: string
    seasonId: string
    teamId: string
    number: number
}

interface ParticipationsSchemaType {
    playerId: string
    matchId: string
}
