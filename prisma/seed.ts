import { MatchStatus, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Adjectives and nouns for unique team names
const adjectives = [
    'Fierce', 'Brave', 'Mighty', 'Swift', 'Legendary', 'Epic', 'Noble', 'Fearless',
    'Gallant', 'Dynamic', 'Savage', 'Bold', 'Valiant', 'Invincible', 'Majestic',
    'Thunderous', 'Unstoppable', 'Cunning', 'Daring', 'Victorious', 'Steadfast',
    'Stormy', 'Iron', 'Crimson', 'Radiant', 'Shadow', 'Golden', 'Silver', 'Wild',
]

const nouns = [
    'Wolves', 'Eagles', 'Warriors', 'Panthers', 'Dragons', 'Titans', 'Falcons',
    'Lions', 'Sharks', 'Phoenix', 'Hawks', 'Bears', 'Tigers', 'Knights', 'Raiders',
    'Crusaders', 'Vikings', 'Spartans', 'Samurai', 'Gladiators', 'Predators',
    'Raptors', 'Cobras', 'Foxes', 'Wizards', 'Guardians', 'Stallions', 'Monarchs',
]

const firstNames = [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
    'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven',
    'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Edward',
    'Alexander', 'Christopher', 'Nathan', 'Logan', 'Aaron', 'Jacob', 'Samuel',
]

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
    'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
    'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis',
    'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill',
]

function generateUniqueTeamName(existingNames: Set<string>): string {
    let name = ''
    do {
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
        const noun = nouns[Math.floor(Math.random() * nouns.length)]
        name = `${adjective} ${noun}`
    } while (existingNames.has(name))
    existingNames.add(name)
    return name
}

function generatePlayerName(): { firstName: string; lastName: string } {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    return {firstName, lastName}
}

function getRandomMatchStatus(): MatchStatus {
    const statuses = [
        {status: 'SCHEDULED', weight: 0.4},
        {status: 'ONGOING', weight: 0.3},
        {status: 'COMPLETED', weight: 0.25},
        {status: 'CANCELED', weight: 0.05},
    ]

    const totalWeight = statuses.reduce((sum, s) => sum + s.weight, 0)
    const random = Math.random() * totalWeight

    let cumulativeWeight = 0
    for (const {status, weight} of statuses) {
        cumulativeWeight += weight
        if (random < cumulativeWeight) {
            return status as MatchStatus
        }
    }
    return 'SCHEDULED'
}

async function seed() {
    console.log('Seeding test data...')

    const existingTeamNames = new Set<string>()
    const existingPlayers = new Map<string, string>() // Map of name to player ID

    const totalSeasons = 5
    const totalTeamsPerSeason = 10
    const totalPlayersPerTeam = 12
    const totalMatchesPerSeason = 50

    const seasonIds = []
    for (let i = 1; i <= totalSeasons; i++) {
        const season = await prisma.season.create({
            data: {
                name: `${2020 + i} Season`,
                startDate: new Date(`${2020 + i}-01-01`),
                endDate: new Date(`${2020 + i}-12-31`),
                isActive: i === totalSeasons,
            },
        })
        console.log(`Created Season ${i}/${totalSeasons}: ${season.name}`)
        seasonIds.push(season.id)
    }

    const teamIds = []
    const playerMap: Record<string, string[]> = {} // Map of teamId to playerIds
    for (const [seasonIndex, seasonId] of seasonIds.entries()) {
        for (let i = 1; i <= totalTeamsPerSeason; i++) {
            const teamName = generateUniqueTeamName(existingTeamNames)
            const team = await prisma.team.create({
                data: {
                    name: teamName,
                    seasonId,
                },
            })
            console.log(`Created Team ${i}/${totalTeamsPerSeason} for Season ${seasonIndex + 1}: ${team.name}`)
            teamIds.push(team.id)

            playerMap[team.id] = []
            for (let j = 1; j <= totalPlayersPerTeam; j++) {
                const {firstName, lastName} = generatePlayerName()
                const playerName = `${firstName} ${lastName}`

                let playerId = existingPlayers.get(playerName)
                if (!playerId) {
                    const player = await prisma.player.create({
                        data: {
                            user: {
                                create: {
                                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                                    name: playerName,
                                    phone: `12345678${i}${j}`,
                                    role: 'USER',
                                },
                            },
                            size: 'LARGE',
                        },
                        include: {
                            user: true,
                        },
                    })
                    console.log(`Created Player ${j}/${totalPlayersPerTeam} for Team ${i}: ${player.user.name}`)
                    playerId = player.id
                    existingPlayers.set(playerName, playerId)
                }

                const existingPlayerSeason = await prisma.playerSeasonDetails.findFirst({
                    where: {playerId, seasonId},
                })

                if (!existingPlayerSeason) {
                    await prisma.playerSeasonDetails.create({
                        data: {
                            playerId,
                            seasonId,
                            teamId: team.id,
                            number: j,
                        },
                    })
                    console.log(
                        `Added Player ${j}/${totalPlayersPerTeam} to Season ${seasonIndex + 1} for Team ${i}`
                    )
                    playerMap[team.id].push(playerId)
                } else {
                    console.log(
                        `Skipped Player ${j}/${totalPlayersPerTeam} for Season ${seasonIndex + 1} (already exists)`
                    )
                }
            }
        }
    }

    for (const [seasonIndex, seasonId] of seasonIds.entries()) {
        for (let i = 1; i <= totalMatchesPerSeason; i++) {
            const homeTeamId = teamIds[Math.floor(Math.random() * teamIds.length)]
            let awayTeamId
            do {
                awayTeamId = teamIds[Math.floor(Math.random() * teamIds.length)]
            } while (awayTeamId === homeTeamId)

            const status = getRandomMatchStatus()
            const winnerId = status === 'COMPLETED' ? (Math.random() < 0.5 ? homeTeamId : awayTeamId) : null

            const match = await prisma.match.create({
                data: {
                    homeTeamId,
                    awayTeamId,
                    seasonId,
                    status,
                    date: new Date(
                        `${new Date().getFullYear()}-${Math.floor(Math.random() * 12) + 1}-${
                            Math.floor(Math.random() * 28) + 1
                        }`
                    ),
                    winnerId,
                },
            })
            console.log(
                `Created Match ${i}/${totalMatchesPerSeason} for Season ${seasonIndex + 1}: ${match.id}`
            )

            const homeTeamPlayers = playerMap[homeTeamId] || []
            const awayTeamPlayers = playerMap[awayTeamId] || []

            for (const [playerIndex, playerId] of [...homeTeamPlayers, ...awayTeamPlayers].entries()) {
                const existingParticipation = await prisma.playerMatchParticipation.findFirst({
                    where: {playerId, matchId: match.id},
                })

                if (!existingParticipation) {
                    const stats = {
                        points: status === 'ONGOING' || status === 'COMPLETED' ? Math.floor(Math.random() * 30) : 0,
                        assists: status === 'ONGOING' || status === 'COMPLETED' ? Math.floor(Math.random() * 10) : 0,
                        rebounds: status === 'ONGOING' || status === 'COMPLETED' ? Math.floor(Math.random() * 15) : 0,
                    }
                    await prisma.playerMatchParticipation.create({
                        data: {
                            playerId,
                            matchId: match.id,
                            stats: {
                                create: stats,
                            },
                        },
                    })
                    console.log(
                        `Added Player ${playerIndex + 1}/${
                            homeTeamPlayers.length + awayTeamPlayers.length
                        } to Match ${i}/${totalMatchesPerSeason}`
                    )
                } else {
                    console.log(`Skipped Player ${playerIndex + 1} for Match ${match.id} (already exists)`)
                }
            }
        }
    }

    // PlayerTotalStats
    for (const [playerIndex, playerId] of existingPlayers.entries()) {
        const participations = await prisma.playerMatchParticipation.findMany({
            where: {playerId},
            include: {stats: true},
        })

        const totalStats = participations.reduce(
            (totals, participation) => {
                if (participation.stats) {
                    totals.points += participation.stats.points
                    totals.assists += participation.stats.assists
                    totals.rebounds += participation.stats.rebounds
                    totals.gamesPlayed += 1
                }
                return totals
            },
            {points: 0, assists: 0, rebounds: 0, gamesPlayed: 0}
        )

        await prisma.playerTotalStats.upsert({
            where: {playerId},
            update: totalStats,
            create: {playerId, ...totalStats},
        })

        console.log(`Updated Total Stats for Player ${playerIndex + 1}/${existingPlayers.size}: ${playerId}`)
    }

    console.log('Seeding complete!')
}

async function cleanup() {
    console.log('Deleting ALL data...')
    await prisma.playerMatchStats.deleteMany({})
    await prisma.playerMatchParticipation.deleteMany({})
    await prisma.playerTotalStats.deleteMany({})
    await prisma.seasonStats.deleteMany({})
    await prisma.match.deleteMany({})
    await prisma.playerSeasonDetails.deleteMany({})
    await prisma.player.deleteMany({})
    await prisma.team.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.season.deleteMany({})
    console.log('All data deleted!')
}

const args = process.argv.slice(2)

if (args.includes('--seed')) {
    seed()
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })
} else if (args.includes('--cleanup')) {
    cleanup()
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })
} else {
    console.error('Invalid or missing flag. Use --seed to seed data or --cleanup to delete test data.')
    process.exit(1)
}
