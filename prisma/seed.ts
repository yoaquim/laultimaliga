/**
 * seed.ts
 *
 * Usage:
 *   npx ts-node seed.ts --seed
 *   npx ts-node seed.ts --cleanup
 */
import { MatchStatus, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Larger name pools
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

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
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

function generateUniquePlayerName(existingNames: Set<string>): { firstName: string; lastName: string } {
    let name = ''
    let uniqueFirstName = ''
    let uniqueLastName = ''

    do {
        const fName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const suffix = Math.floor(Math.random() * 10000) // up to 4-digit random
        name = `${fName} ${lName}#${suffix}`
        uniqueFirstName = `${fName}#${suffix}`
        uniqueLastName = lName
    } while (existingNames.has(name))

    existingNames.add(name)
    return {firstName: uniqueFirstName, lastName: uniqueLastName}
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

function getRandomDateWithinSeason(startDate: Date, endDate: Date): Date {
    const start = startDate.getTime()
    const end = endDate.getTime()
    const randomTime = start + Math.random() * (end - start)
    return new Date(randomTime)
}

// -------------------------------------------------------------
// Main Seed Logic
// -------------------------------------------------------------
async function seed() {
    console.log('Seeding test data...')

    const totalSeasons = 5
    const totalTeamsPerSeason = 10
    const totalPlayersPerTeam = 12
    const totalMatchesPerSeason = 50

    // 1) Create Seasons
    const seasonRecords: { id: string; startDate: Date; endDate: Date }[] = []
    for (let i = 1; i <= totalSeasons; i++) {
        const year = 2020 + i
        const startDate = new Date(`${year}-01-01`)
        const endDate = new Date(`${year}-12-31`)

        const season = await prisma.season.create({
            data: {
                name: `${year} Season`,
                startDate,
                endDate,
                isActive: i === totalSeasons,
            },
        })
        console.log(`Created Season ${i}/${totalSeasons}: ${season.name}`)
        seasonRecords.push({id: season.id, startDate, endDate})
    }

    // 2) Create Teams & Players
    const seasonTeamsMap: Record<string, string[]> = {}
    const existingPlayersGlobal = new Map<string, string>()

    for (const [seasonIndex, seasonData] of seasonRecords.entries()) {
        const {id: seasonId} = seasonData
        const existingTeamNames = new Set<string>()

        const teamIds: string[] = []
        for (let i = 1; i <= totalTeamsPerSeason; i++) {
            const teamName = generateUniqueTeamName(existingTeamNames)
            const team = await prisma.team.create({
                data: {
                    name: teamName,
                    seasonId,
                    logo: '',
                },
            })
            teamIds.push(team.id)
            console.log(`Created Team ${i}/${totalTeamsPerSeason} in Season ${seasonIndex + 1}: ${team.name}`)

            // Create 12 players for this team
            const teamPlayerCreation = Array.from({length: totalPlayersPerTeam}, async (_, j) => {
                const seasonalNames = new Set<string>()
                let player: any = null
                let tries = 0

                while (!player) {
                    if (tries++ > 5000) {
                        throw new Error('Too many name collision attempts, aborting.')
                    }
                    const {firstName, lastName} = generateUniquePlayerName(seasonalNames)
                    const fullNameKey = (firstName + lastName).toLowerCase()

                    const existingPlayerId = existingPlayersGlobal.get(fullNameKey)
                    if (!existingPlayerId) {
                        // create new
                        const created = await prisma.player.create({
                            data: {
                                user: {
                                    create: {
                                        email: `${firstName.replace('#', '')}.${lastName}@example.com`.toLowerCase(),
                                        name: `${firstName.replace('#', '')} ${lastName}`,
                                        phone: `1234-${Math.floor(Math.random() * 999999)}`,
                                        role: 'USER',
                                    },
                                },
                                size: 'LARGE',
                            },
                            include: {user: true},
                        })
                        player = created
                        existingPlayersGlobal.set(fullNameKey, created.id)
                    } else {
                        // check if that existing player is already in this season
                        const foundPlayer = await prisma.player.findUnique({
                            where: {id: existingPlayerId},
                            include: {
                                seasonDetails: {
                                    where: {seasonId},
                                },
                            },
                        })
                        if (foundPlayer?.seasonDetails.length) {
                            // that player is already in this season => skip
                            continue
                        } else {
                            // re-use this player for a new season
                            player = foundPlayer
                        }
                    }
                }

                // create PlayerSeasonDetails
                await prisma.playerSeasonDetails.create({
                    data: {
                        playerId: player.id,
                        seasonId,
                        teamId: team.id,
                        number: j + 1,
                    },
                })

                console.log(
                    `  [Team ${i}/${totalTeamsPerSeason}] Created/Attached Player ${j + 1}/${totalPlayersPerTeam}: ${
                        player?.user?.name ?? 'Unknown'
                    }`
                )

                // upsert SeasonStats
                await prisma.playerSeasonStats.upsert({
                    where: {
                        playerId_seasonId: {
                            playerId: player.id,
                            seasonId,
                        },
                    },
                    create: {
                        playerId: player.id,
                        seasonId,
                    },
                    update: {},
                })
            })

            await Promise.all(teamPlayerCreation)
        }
        seasonTeamsMap[seasonId] = teamIds
    }

    // 3) Create Matches + Player Participations
    for (const [seasonIndex, seasonData] of seasonRecords.entries()) {
        const {id: seasonId, startDate, endDate} = seasonData
        const teamIds = seasonTeamsMap[seasonId]

        console.log(`Creating matches for Season ${seasonIndex + 1}...`)
        const chunkSize = 10
        for (let chunkStart = 0; chunkStart < totalMatchesPerSeason; chunkStart += chunkSize) {
            const chunkEnd = Math.min(chunkStart + chunkSize, totalMatchesPerSeason)
            const matchCreations = []
            for (let i = chunkStart; i < chunkEnd; i++) {
                matchCreations.push(
                    (async () => {
                        const homeTeamId = teamIds[Math.floor(Math.random() * teamIds.length)]
                        let awayTeamId = homeTeamId
                        while (awayTeamId === homeTeamId) {
                            awayTeamId = teamIds[Math.floor(Math.random() * teamIds.length)]
                        }

                        const status = getRandomMatchStatus()
                        const winnerId =
                            status === 'COMPLETED'
                                ? Math.random() < 0.5
                                    ? homeTeamId
                                    : awayTeamId
                                : null

                        const matchDate = getRandomDateWithinSeason(startDate, endDate)

                        const match = await prisma.match.create({
                            data: {
                                homeTeamId,
                                awayTeamId,
                                seasonId,
                                status,
                                date: matchDate,
                                winnerId,
                                // homeScore, awayScore default to 0 via schema
                            },
                        })

                        console.log(`  Created Match #${i + 1}/${totalMatchesPerSeason}: ${match.id}`)

                        // create player participations
                        const [homePlayers, awayPlayers] = await Promise.all([
                            prisma.playerSeasonDetails.findMany({
                                where: {teamId: homeTeamId, seasonId},
                                include: {player: true},
                            }),
                            prisma.playerSeasonDetails.findMany({
                                where: {teamId: awayTeamId, seasonId},
                                include: {player: true},
                            }),
                        ])
                        const allPlayers = [...homePlayers, ...awayPlayers]

                        await Promise.all(
                            allPlayers.map(async (psd) => {
                                let statsData = {points: 0, assists: 0, rebounds: 0}
                                if (status === 'ONGOING' || status === 'COMPLETED') {
                                    statsData = {
                                        points: Math.floor(Math.random() * 30),
                                        assists: Math.floor(Math.random() * 10),
                                        rebounds: Math.floor(Math.random() * 15),
                                    }
                                }
                                await prisma.playerMatchParticipation.create({
                                    data: {
                                        playerId: psd.playerId,
                                        matchId: match.id,
                                        stats: {
                                            create: statsData,
                                        },
                                    },
                                })
                            })
                        )

                        // If match is ONGOING or COMPLETED, let's update homeScore & awayScore:
                        if (status === 'ONGOING' || status === 'COMPLETED') {
                            const homePlayerIds = homePlayers.map((p) => p.playerId)
                            const awayPlayerIds = awayPlayers.map((p) => p.playerId)

                            const [homeStats, awayStats] = await Promise.all([
                                prisma.playerMatchStats.findMany({
                                    where: {
                                        participation: {
                                            matchId: match.id,
                                            playerId: {in: homePlayerIds},
                                        },
                                    },
                                    select: {points: true},
                                }),
                                prisma.playerMatchStats.findMany({
                                    where: {
                                        participation: {
                                            matchId: match.id,
                                            playerId: {in: awayPlayerIds},
                                        },
                                    },
                                    select: {points: true},
                                }),
                            ])

                            const homeTotalPoints = homeStats.reduce((sum, s) => sum + s.points, 0)
                            const awayTotalPoints = awayStats.reduce((sum, s) => sum + s.points, 0)

                            await prisma.match.update({
                                where: {id: match.id},
                                data: {
                                    homeScore: homeTotalPoints,
                                    awayScore: awayTotalPoints,
                                },
                            })
                        }
                    })()
                )
            }
            await Promise.all(matchCreations)
        }
    }

    // 4) Update PlayerTotalStats for each player
    const allPlayers = await prisma.player.findMany({
        select: {id: true},
    })

    const batchSize = 50
    for (let start = 0; start < allPlayers.length; start += batchSize) {
        const end = Math.min(start + batchSize, allPlayers.length)
        const playerBatch = allPlayers.slice(start, end)

        await Promise.all(
            playerBatch.map(async (p) => {
                const participations = await prisma.playerMatchParticipation.findMany({
                    where: {playerId: p.id},
                    include: {stats: true},
                })

                const totalStats = participations.reduce(
                    (totals, part) => {
                        if (part.stats) {
                            totals.points += part.stats.points
                            totals.assists += part.stats.assists
                            totals.rebounds += part.stats.rebounds
                            totals.gamesPlayed += 1
                        }
                        return totals
                    },
                    {points: 0, assists: 0, rebounds: 0, gamesPlayed: 0}
                )

                await prisma.playerTotalStats.upsert({
                    where: {playerId: p.id},
                    create: {playerId: p.id, ...totalStats},
                    update: totalStats,
                })
            })
        )
        console.log(`Updated PlayerTotalStats for players ${start + 1} to ${end} of ${allPlayers.length}`)
    }

    console.log('Seeding complete!')
}

// -------------------------------------------------------------
// Cleanup
// -------------------------------------------------------------
async function cleanup() {
    console.log('Deleting ALL data...')
    await prisma.playerMatchStats.deleteMany({})
    await prisma.playerMatchParticipation.deleteMany({})
    await prisma.playerTotalStats.deleteMany({})
    await prisma.playerSeasonStats.deleteMany({})
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
