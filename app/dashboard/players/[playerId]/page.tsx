import { Position, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import Empty from '@/ui/empty'
import { BUCKET_ENDPOINT, DEFAULT_PROFILE_PIC_BUILDER, EMPTY_MESSAGES, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import clsx from 'clsx'
import { MdScoreboard } from 'react-icons/md'
import { FaHandsHelping } from 'react-icons/fa'
import { MdSportsHandball } from 'react-icons/md'
import { MdSports } from 'react-icons/md'
import { MdSportsScore } from 'react-icons/md'
import MatchCard from '@/ui/match-card'

type PlayerDetail = Prisma.PlayerGetPayload<{
    include: {
        user: true
        totalStats: true
        SeasonStats: {
            include: {
                season: true
            }
        }
        seasonDetails: {
            include: {
                season: true
                team: true
            }
        }
        participations: {
            include: {
                match: {
                    include: {
                        season: true
                    }
                }
            }
        }
    }
}>

async function getPlayer(playerId: string): Promise<PlayerDetail | null> {
    return prisma.player.findUnique({
        where: {id: playerId},
        include: {
            user: true,
            totalStats: true,
            SeasonStats: {
                include: {
                    season: true,
                },
            },
            seasonDetails: {
                include: {
                    season: true,
                    team: true,
                },
            },
            participations: {
                include: {
                    match: {
                        include: {
                            homeTeam: true,
                            awayTeam: true,
                            season: true,
                        },
                    },
                    stats: true
                },
            },
        },
    })
}

function StatsCard({
                       title,
                       titleColor = 'white',
                       points,
                       assists,
                       rebounds,
                       fouls,
                       games
                   }: { title: string, titleColor?: 'white' | 'red' | 'blue' | 'green' | 'yellow' | 'orange', points: number, assists: number, rebounds: number, fouls: number, games: number }) {
    return (
        <div className="w-full flex flex-col bg-lul-grey/20 rounded-md py-4 px-6">
            <h2 className={clsx('w-full flex justify-between text-xl font-bold uppercase border-b border-b-lul-blue', {
                'text-lul-red': titleColor === 'red',
                'text-lul-blue': titleColor === 'blue',
                'text-lul-green': titleColor === 'green',
                'text-lul-yellow': titleColor === 'yellow',
                'text-lul-orange': titleColor === 'orange',
                'text-white': titleColor === 'white',
            })}>
                {title}
            </h2>

            <div className="w-full pt-8 pb-4 grid lg:grid-cols-5 grid-cols-2 gap-6">
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <MdScoreboard className="text-lul-green text-3xl"/>
                    <p className="text-3xl font-bold text-white">{points}</p>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Points</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <FaHandsHelping className="text-lul-blue text-3xl"/>
                    <p className="text-3xl font-bold text-white">{assists}</p>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Assists</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <MdSportsHandball className="text-lul-yellow text-3xl"/>
                    <p className="text-3xl font-bold text-white">{rebounds}</p>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Rebounds</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <MdSports className="text-lul-red text-3xl"/>
                    <p className="text-3xl font-bold text-white">{fouls}</p>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Fouls</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2 lg:col-span-1 col-span-full">
                    <MdSportsScore className="text-white text-3xl"/>
                    <p className="text-3xl font-bold text-white">{games}</p>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Games</p>
                </div>
            </div>
        </div>
    )
}

export default async function Page({params}: { params: Promise<{ playerId: string }> }) {
    const {playerId} = await params
    const player = await getPlayer(playerId)

    if (!player) {
        return <Empty message={EMPTY_MESSAGES.PLAYER_DOES_NOT_EXIST}/>
    }

    // Find an "active" or "current" season detail to show the player's current team
    const activeSeasonDetail = player.seasonDetails.find((sd) => sd.season.isActive)
    const currentTeam = activeSeasonDetail?.team

    // total stats
    const {
        points: totalPoints = 0,
        assists: totalAssists = 0,
        rebounds: totalRebounds = 0,
        fouls: totalFouls = 0,
        gamesPlayed: totalGamesPlayed = 0,
    } = player.totalStats || {}

    // Find "current" SeasonStats record (for the active season)
    const activeSeasonStats = player.SeasonStats.find(
        (st) => st.season.isActive === true
    )
    const {
        points: seasonPoints = 0,
        assists: seasonAssists = 0,
        rebounds: seasonRebounds = 0,
        fouls: seasonFouls = 0,
        gamesPlayed: seasonGP = 0,
    } = activeSeasonStats || {}

    // Gather matches (by date ascending)
    const matches = player.participations
        .map((p) => p.match)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const profilePic = player.user.image
        ? `${BUCKET_ENDPOINT}/players/${player.user.image}`
        : DEFAULT_PROFILE_PIC_BUILDER(player.user.name)

    const positionMap: Record<Position, string> = {
        PG: 'Point Guard',
        SG: 'Shooting Guard',
        SF: 'Strong Forward',
        PF: 'Power Forward',
        C: 'Center',
        PG_SG: 'Point Guard - Shooting Guard',
        PG_SF: 'Point Guard - Small Forward',
        PG_PF: 'Point Guard - Power Forward',
        SG_SF: 'Shooting Guard - Small Forward',
        SG_PF: 'Shooting Guard - Power Forward',
        PF_C: 'Power Forward - Center'
    }

    if (!player) {
        return <Empty message={EMPTY_MESSAGES.PLAYER_DOES_NOT_EXIST}/>
    }


    const currentSeasonCardTitle = activeSeasonDetail?.season.shortName
        ? activeSeasonDetail.season.shortName
        : activeSeasonDetail?.season.name || 'No active season'

    return (
        <div className="w-full h-full flex flex-col gap-y-8 py-8 text-white overflow-y-auto">
            {/* =============================*/}
            {/* PLAYER HEADER */}
            {/* =============================*/}
            <div className="flex lg:flex-row flex-col justify-between items-center gap-y-8">
                {/* PLAYER PIC */}
                <img src={profilePic} alt="profile-pic" className="h-40 rounded-full"/>
                {/* PLAYER NAME & POSITION*/}
                <div className="flex flex-col items-center justify-center">
                    <h1 className="lg:text-5xl text-3xl font-bold tracking-wide text-center">{player.user.name}</h1>
                    {activeSeasonDetail &&
                        <h1 className="font-bold text-3xl text-lul-yellow">#{activeSeasonDetail.number}</h1>
                    }
                    <p className="pt-1 text-lul-blue uppercase tracking-wider text-sm font-semibold">
                        {player.position ? positionMap[player.position] : 'No position yet'}
                    </p>

                </div>
                {/* PLAYER TEAM*/}
                {currentTeam &&
                    <img src={TEAM_LOGO_URL_BUILDER(currentTeam.logo)} alt="team-logo" className="h-40"/>
                }
                {!currentTeam &&
                    <div className="text-xl text-lul-yellow uppercase font-bold">FREE AGENT</div>
                }
            </div>

            {/* =============================*/}
            {/* STAT SECTION */}
            {/* =============================*/}
            <div className="flex flex-col gap-y-6">
                {/* -----------------------------*/}
                {/* TOTAL STATS CARD */}
                {/* -----------------------------*/}
                <StatsCard title="Total Stats"
                           points={totalPoints}
                           assists={totalAssists}
                           rebounds={totalRebounds}
                           fouls={totalFouls}
                           games={totalGamesPlayed}/>


                {/* -----------------------------*/}
                {/* CURRENT SEASON STATS CARD */}
                {/* -----------------------------*/}
                <StatsCard title={currentSeasonCardTitle}
                           titleColor={activeSeasonDetail && activeSeasonDetail.season ? 'blue' : 'red'}
                           points={seasonPoints}
                           assists={seasonAssists}
                           rebounds={seasonRebounds}
                           fouls={seasonFouls}
                           games={seasonGP}/>
            </div>

            {/* =============================*/}
            {/* MATCHES SECTION */}
            {/* =============================*/}
            <div className="w-full h-fit flex flex-col bg-lul-grey/20 rounded-md py-4 px-6">
                <h2 className={clsx('w-full flex justify-between text-xl font-bold uppercase border-b border-b-lul-blue')}>
                    Matches
                </h2>

                {matches.length === 0
                    ? <Empty message={EMPTY_MESSAGES.NO_MATCHES}/>
                    :
                    <div className="grid lg:grid-cols-3 grid-cols-1 lg:gap-6 gap-y-6 py-6">
                        {player.participations.map((participation: any) => {
                            const {match, stats} = participation

                            return (
                                <div key={match.id} className="flex flex-col">
                                    <div className="w-full bg-lul-grey/20 py-2 px-5 flex justify-between rounded-t-md border-b border-b-lul-light-grey">
                                        <div className="flex gap-x-1 items-center">
                                            <MdScoreboard className="text-lul-green text-2xl"/>
                                            <p className="text-2xl font-bold text-white">{stats.points}</p>
                                        </div>
                                        <div className="flex gap-x-1 items-center">
                                            <FaHandsHelping className="text-lul-blue text-2xl"/>
                                            <p className="text-2xl font-bold text-white">{stats.assists}</p>
                                        </div>
                                        <div className="flex gap-x-1 items-center">
                                            <MdSportsHandball className="text-lul-yellow text-2xl"/>
                                            <p className="text-2xl font-bold text-white">{stats.rebounds}</p>
                                        </div>
                                        <div className="flex gap-x-1 items-center">
                                            <MdSports className="text-lul-red text-2xl"/>
                                            <p className="text-2xl font-bold text-white">{stats.fouls}</p>
                                        </div>
                                    </div>
                                    <MatchCard match={match} noTopRadius/>
                                </div>
                            )
                        })}
                    </div>
                }
            </div>
        </div>
    )
}
