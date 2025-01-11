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
    return { firstName, lastName }
}

function getRandomMatchStatus(): MatchStatus {
    const statuses = [
        { status: 'SCHEDULED', weight: 0.4 },
        { status: 'ONGOING', weight: 0.3 },
        { status: 'COMPLETED', weight: 0.25 },
        { status: 'CANCELED', weight: 0.05 },
    ]

    const totalWeight = statuses.reduce((sum, s) => sum + s.weight, 0)
    const random = Math.random() * totalWeight

    let cumulativeWeight = 0
    for (const { status, weight } of statuses) {
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
    const existingPlayers = new Map<string, string>()

    const seasonIds = []
    for (let i = 1; i <= 5; i++) {
        const season = await prisma.season.create({
            data: {
                name: `${2020 + i} Season`,
                startDate: new Date(`${2020 + i}-01-01`),
                endDate: new Date(`${2020 + i}-12-31`),
                isActive: i === 5,
            },
        })
        seasonIds.push(season.id)
    }

    const teamIds = []
    const playerMap: Record<string, string[]> = {}

    for (const seasonId of seasonIds) {
        for (let i = 1; i <= 10; i++) {
            const teamName = generateUniqueTeamName(existingTeamNames)
            const team = await prisma.team.create({
                data: {
                    name: teamName,
                    seasonId,
                },
            })
            teamIds.push(team.id)
            playerMap[team.id] = []

            for (let j = 1; j <= 12; j++) {
                const { firstName, lastName } = generatePlayerName()
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
                        include: { user: true },
                    })
                    playerId = player.id
                    existingPlayers.set(playerName, playerId)
                }

                await prisma.playerSeasonDetails.create({
                    data: {
                        playerId,
                        seasonId,
                        teamId: team.id,
                        number: j,
                    },
                })
                playerMap[team.id].push(playerId)
            }
        }
    }

    for (const seasonId of seasonIds) {
        for (let i = 1; i <= 50; i++) {
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
                        }`,
                    ),
                    winnerId,
                },
            })

            const homeTeamPlayers = playerMap[homeTeamId] || []
            const awayTeamPlayers = playerMap[awayTeamId] || []

            for (const playerId of [...homeTeamPlayers, ...awayTeamPlayers]) {
                const participation = await prisma.playerMatchParticipation.create({
                    data: {
                        playerId,
                        matchId: match.id,
                    },
                })

                if (status === 'ONGOING' || status === 'COMPLETED') {
                    await prisma.playerMatchStats.create({
                        data: {
                            playerMatchParticipationId: participation.id,
                            points: Math.floor(Math.random() * 30),
                            assists: Math.floor(Math.random() * 10),
                            rebounds: Math.floor(Math.random() * 15),
                        },
                    })
                } else {
                    await prisma.playerMatchStats.create({
                        data: {
                            playerMatchParticipationId: participation.id,
                            points: 0,
                            assists: 0,
                            rebounds: 0,
                        },
                    })
                }
            }
        }
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
