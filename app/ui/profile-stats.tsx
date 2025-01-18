'use client'

import { Position } from '@prisma/client'
import Empty from '@/ui/empty'
import { EMPTY_MESSAGES, PROFILE_PIC_BUILDER, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import clsx from 'clsx'
import { MdScoreboard } from 'react-icons/md'
import { FaHandsHelping } from 'react-icons/fa'
import { MdSportsHandball } from 'react-icons/md'
import { MdSports } from 'react-icons/md'
import { MdSportsScore } from 'react-icons/md'
import MatchCard from '@/ui/match-card'
import { Container } from '@/ui/container'
import { jersey10 } from '@/ui/fonts'
import Score from '@/ui/score'
import { ChangeEvent, useEffect, useState } from 'react'
import { ProfileWithDetails, SeasonOption } from '@/dashboard/types'
import { getAllSeasons, getPlayerStatsForSeason } from '@/dashboard/actions'
import Loader from '@/ui/loader'

function StatsCard({
                       title,
                       titleColor = 'white',
                       points,
                       assists,
                       rebounds,
                       fouls,
                       games
                   }: { title: string, titleColor?: 'white' | 'red' | 'blue' | 'green' | 'yellow' | 'orange', points: number, assists: number, rebounds: number, fouls: number, games: number }) {

    const avgPoints =
        games > 0 ? (points / games).toFixed(1) : '0.0'
    const avgAssists =
        games > 0 ? (assists / games).toFixed(1) : '0.0'
    const avgRebounds =
        games > 0 ? (rebounds / games).toFixed(1) : '0.0'
    const avgFouls =
        games > 0 ? (fouls / games).toFixed(1) : '0.0'

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

            <div className={`w-full pt-8 pb-4 grid lg:grid-cols-5 grid-cols-2 gap-6`}>
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <MdScoreboard className="text-lul-green text-3xl"/>
                    <div className="flex flex-col items-center gap-y-2">
                        <div className="w-full flex gap-x-5 justify-between text-xs font-semibold">
                            <div>ALL</div>
                            <div>AVG</div>
                        </div>
                        <div className={`flex items-end -mt-3 gap-x-5 text-5xl ${jersey10.className}`}>
                            <div>{points}</div>
                            <div className="text-lul-light-grey text-3xl">{avgPoints}</div>
                        </div>
                    </div>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Points</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <FaHandsHelping className="text-lul-blue text-3xl"/>
                    <div className="flex flex-col items-center gap-y-2">
                        <div className="w-full flex gap-x-5 justify-between text-xs font-semibold">
                            <div>ALL</div>
                            <div>AVG</div>
                        </div>
                        <div className={`flex items-end -mt-3 gap-x-5 text-5xl ${jersey10.className}`}>
                            <div>{assists}</div>
                            <div className="text-lul-light-grey text-3xl">{avgAssists}</div>
                        </div>
                    </div>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Assists</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <MdSportsHandball className="text-lul-yellow text-3xl"/>
                    <div className="flex flex-col items-center gap-y-2">
                        <div className="w-full flex gap-x-5 justify-between text-xs font-semibold">
                            <div>ALL</div>
                            <div>AVG</div>
                        </div>
                        <div className={`flex items-end -mt-3 gap-x-5 text-5xl ${jersey10.className}`}>
                            <div>{rebounds}</div>
                            <div className="text-lul-light-grey text-3xl">{avgRebounds}</div>
                        </div>
                    </div>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Rebounds</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2">
                    <MdSports className="text-lul-red text-3xl"/>
                    <div className="flex flex-col items-center gap-y-2">
                        <div className="w-full flex gap-x-5 justify-between text-xs font-semibold">
                            <div>ALL</div>
                            <div>AVG</div>
                        </div>
                        <div className={`flex items-end -mt-3 gap-x-5 text-5xl ${jersey10.className}`}>
                            <div>{fouls}</div>
                            <div className="text-lul-light-grey text-3xl">{avgFouls}</div>
                        </div>
                    </div>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Fouls</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-y-2 lg:col-span-1 col-span-full">
                    <MdSportsScore className="text-white text-3xl"/>
                    <Score className="text-5xl font-bold text-white" value={games}/>
                    <p className="uppercase text-xs text-lul-light-grey tracking-wider font-semibold">Games</p>
                </div>
            </div>
        </div>
    )
}


export default function ProfileStats({playerId}: { playerId: string }) {
    const [profile, setProfile] = useState<ProfileWithDetails | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    // State for season filtering
    const [seasons, setSeasons] = useState<SeasonOption[]>([])
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')

    // Load seasons on mount
    useEffect(() => {
        async function loadSeasons() {
            try {
                const seasonOptions: SeasonOption[] = await getAllSeasons()
                setSeasons(seasonOptions)
                // Default to the first season (assumed latest)
                if (seasonOptions.length > 0) {
                    setSelectedSeasonId(seasonOptions[0].id)
                }
            } catch (err) {
                console.error('Error fetching seasons', err)
            }
        }

        loadSeasons()
    }, [])

    // Fetch page data whenever page or selectedSeasonId changes
    useEffect(() => {
        if (!selectedSeasonId) return

        async function fetchProfileData() {
            setLoading(true)
            const profileData: ProfileWithDetails | null = await getPlayerStatsForSeason(playerId, selectedSeasonId)
            setProfile(profileData)
            setLoading(false)
        }

        fetchProfileData()
    }, [selectedSeasonId])

    if (loading) return <Loader/>
    if (!profile) return <Empty message={EMPTY_MESSAGES.PLAYER_DOES_NOT_EXIST}/>

    const seasonDetail = profile.seasonDetails.find((sd) => sd.season.id === selectedSeasonId)
    const seasonStats = profile.SeasonStats.find((st) => st.season.id === selectedSeasonId)

    const seasonTeam = seasonDetail?.team
    const seasonJerseyNumber = seasonDetail?.number

    // Total Stats
    const {
        points: totalPoints = 0,
        assists: totalAssists = 0,
        rebounds: totalRebounds = 0,
        fouls: totalFouls = 0,
        gamesPlayed: totalGamesPlayed = 0,
    } = profile.totalStats || {}

    // Season Stats
    const {
        points: seasonPoints = 0,
        assists: seasonAssists = 0,
        rebounds: seasonRebounds = 0,
        fouls: seasonFouls = 0,
        gamesPlayed: seasonGP = 0,
    } = seasonStats || {}

    // Gather matches (by date ascending)
    const matches = profile.participations
        .filter((p) => p.match.seasonId === selectedSeasonId)
        .map((p) => p.match)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

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

    return (
        <Container className="gap-y-8 py-8">
            <div className="mt-3 flex justify-center items-center gap-x-1">
                <select
                    className={`lg:w-1/4 text-lg bg-none font-semibold w-full text-center  border-lul-yellow focus:border-lul-yellow active:border-lul-yellow border outline-lul-yellow bg-lul-dark-grey px-1 rounded-full uppercase text-lul-yellow py-1.5 mb-2 cursor-pointer`}
                    name="filter"
                    id="filter"
                    value={selectedSeasonId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        e.preventDefault()
                        setSelectedSeasonId(e.target.value)
                    }}
                >
                    <optgroup>
                        {seasons.map(({id, name}) => (
                            <option key={id} value={id} style={{textAlign: 'center', width: '100%'}}>
                                {name}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>

            {/* =============================*/}
            {/* PLAYER HEADER */}
            {/* =============================*/}
            <div className="pt-6 flex lg:flex-row flex-col justify-between items-center gap-y-8">
                {/* PLAYER PIC */}
                <img
                    src={PROFILE_PIC_BUILDER(profile.user)}
                    alt="profile-pic"
                    className="h-48 w-48 rounded-full object-cover cursor-pointer transition-opacity duration-300"
                />

                {/* PLAYER NAME & POSITION*/}
                <div className="flex flex-col items-center justify-center">
                    <h1 className="uppercase lg:text-5xl text-3xl font-bold tracking-wide text-center">{profile.user.name}</h1>
                    {seasonJerseyNumber &&
                        <div className="flex items-end">
                            <Score className="pb-1 flex font-bold leading-none text-4.5xl text-lul-yellow" value="#"/>
                            <Score className="font-bold leading-none text-6xl text-lul-yellow" value={seasonJerseyNumber}/>
                        </div>
                    }
                    <p className="pt-1 text-lul-blue uppercase tracking-wider text-sm font-semibold">
                        {profile.position ? positionMap[profile.position] : 'No position yet'}
                    </p>

                </div>

                {/* PLAYER TEAM*/}
                {seasonTeam &&
                    <img src={TEAM_LOGO_URL_BUILDER(seasonTeam.logo)} alt="team-logo" className="h-40"/>
                }

                {!seasonTeam &&
                    <div className="text-center font-bold text-lg text-lul-black rounded-full bg-white p-6">
                        FREE<br/>AGENT
                    </div>
                }
            </div>

            {/* =============================*/}
            {/* STAT SECTION */}
            {/* =============================*/}
            <div className="mt-8 lg:mt-0 flex flex-col gap-y-6">
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
                {seasonDetail && seasonStats
                    ? (
                        <StatsCard
                            title={seasonDetail.season.name}
                            points={seasonPoints}
                            assists={seasonAssists}
                            rebounds={seasonRebounds}
                            fouls={seasonFouls}
                            games={seasonGP}
                        />
                    )
                    : (
                        <h1 className="text-5xl text-lul-red">NO SEASON STATS</h1>
                    )
                }
            </div>

            {/* =============================*/
            }
            {/* MATCHES SECTION */
            }
            {/* =============================*/
            }
            <div className="lg:mt-0 mt-6 w-full h-fit flex flex-col bg-lul-grey/20 rounded-md py-4 px-6">
                <h2 className={clsx('w-full flex justify-between text-xl font-bold uppercase border-b border-b-lul-blue')}>
                    Matches
                </h2>

                {matches.length === 0
                    ?
                    <div className="pt-8 pb-4">
                        <Empty message="No matches found for this season"/>
                    </div>
                    :
                    <div className="grid lg:grid-cols-3 grid-cols-1 lg:gap-6 gap-y-6 py-6">
                        {profile.participations.map((participation: any) => {
                            const {match, stats} = participation

                            return (
                                <div key={match.id} className="flex flex-col">
                                    <div className="w-full bg-lul-grey/20 py-2 px-5 flex justify-between rounded-t-md border-b border-b-lul-light-grey">
                                        <div className="flex gap-x-1 items-center">
                                            <MdScoreboard className="text-lul-green text-2.5xl"/>
                                            <p className={`text-4xl leading-none font-bold text-white ${jersey10.className}`}>{stats.points}</p>
                                        </div>
                                        <div className="flex gap-x-1 items-center">
                                            <FaHandsHelping className="text-lul-blue text-2.5xl"/>
                                            <p className={`text-4xl leading-none font-bold text-white ${jersey10.className}`}>{stats.assists}</p>
                                        </div>
                                        <div className="flex gap-x-1 items-center">
                                            <MdSportsHandball className="text-lul-yellow text-2.5xl"/>
                                            <p className={`text-4xl leading-none font-bold text-white ${jersey10.className}`}>{stats.rebounds}</p>
                                        </div>
                                        <div className="flex gap-x-1 items-center">
                                            <MdSports className="text-lul-red text-2.5xl"/>
                                            <p className={`text-4xl leading-none font-bold text-white ${jersey10.className}`}>{stats.fouls}</p>
                                        </div>
                                    </div>
                                    <MatchCard match={match} noTopRadius/>
                                </div>
                            )
                        })}
                    </div>
                }
            </div>
        </Container>
    )
}
