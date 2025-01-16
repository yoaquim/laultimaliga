import { prisma } from '@/lib/prisma'
import { EMPTY_MESSAGES, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import Empty from '@/ui/empty'
import PlayerCard from '@/ui/player-card'
import MatchCard from '@/ui/match-card'
import clsx from 'clsx'
import { Container } from '@/ui/container'
import CardGrid from '@/ui/card-grid'
import Score from '@/ui/score'

export default async function Page({params}: { params: Promise<{ teamId: string }> }) {
    const {teamId} = await params

    // Fetch team details, players, matches, and stats
    const team = await prisma.team.findUnique({
        where: {id: teamId},
        include: {
            players: {
                include: {
                    player: {
                        include: {
                            user: true,
                            seasonDetails: {
                                include: {
                                    team: {
                                        include: {
                                            season: true,
                                        },
                                    },
                                },
                            },
                            SeasonStats: true,
                        },
                    },
                },
            },
            homeMatches: {
                include: {
                    season: true,
                    awayTeam: true,
                    homeTeam: true,
                },
            },
            awayMatches: {
                include: {
                    season: true,
                    homeTeam: true,
                    awayTeam: true,
                },
            },
            season: true,
            wins: true,
        },
    })

    if (!team) return <Empty message={EMPTY_MESSAGES.TEAM_DOES_NOT_EXIST}/>

    const totalMatches = team.homeMatches.length + team.awayMatches.length
    const matchesWon = team.wins.length
    const winRate = totalMatches > 0 ? ((matchesWon / totalMatches) * 100).toFixed(2) : 'N/A'

    return (
        <Container className="flex flex-col pt-6 gap-y-8">
            {/*=====================================================*/}
            {/* TEAM STATS */}
            {/*=====================================================*/}
            <div className="w-full flex flex-col justify-center items-center gap-y-2">
                <h1 className="text-center font-bold text-2xl text-white uppercase">{team.name}</h1>

                <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 bg-lul-grey/20 py-4 rounded-md">
                    <div className="flex flex-col items-center gap-y-0.5">
                        <p className="text-sm uppercase font-bold">Season</p>
                        <p className="text-3xl mt-2 font-bold text-lul-blue">{team.season.shortName || team.season.name}</p>
                    </div>
                    <div className="flex flex-col items-center gap-y-0.5">
                        <p className="text-sm uppercase font-bold">Total Matches</p>
                        <Score className="leading-none text-4.5xl font-bold" value={totalMatches}/>
                    </div>
                    <div className="flex flex-col items-center gap-y-0.5">
                        <p className="text-sm uppercase font-bold">Matches Won</p>
                        <Score className="leading-none text-4.5xl font-bold text-lul-green" value={matchesWon}/>
                    </div>
                    <div className="flex flex-col items-center gap-y-0.5">
                        <p className="text-sm uppercase font-bold">Win Rate</p>
                        <Score value={`${winRate}%`}
                               className={clsx('leading-none text-4.5xl font-bold', {
                                   'text-lul-yellow': matchesWon / totalMatches <= 0.5,
                                   'text-lul-green': matchesWon / totalMatches > 0.5,
                                   'text-lul-red': totalMatches === 0,
                               })}/>
                    </div>
                </div>
            </div>

            {/*=====================================================*/}
            {/* LOGO */}
            {/*=====================================================*/}
            <div className="w-full flex justify-center items-center">
                <img src={TEAM_LOGO_URL_BUILDER(team.logo)} alt="team-logo" className="lg:h-64 h-40"/>
            </div>

            {/*=====================================================*/}
            {/* PLAYERS & MATCHES */}
            {/*=====================================================*/}
            <div className="h-full lg:flex-row lg:gap-x-8 w-full flex flex-col gap-y-6 flex-grow lg:overflow-hidden">
                {/*-----------------------------------------------------*/}
                {/* PLAYERS */}
                {/*-----------------------------------------------------*/}
                <CardGrid title="Players" borderTitleColor="blue" forceLessCols>
                    {team.players.map((playerSeasonDetail: any) => (
                        <PlayerCard player={playerSeasonDetail.player} key={playerSeasonDetail.player.id}/>
                    ))}
                </CardGrid>

                {/*-----------------------------------------------------*/}
                {/* MATCHES */}
                {/*-----------------------------------------------------*/}
                <CardGrid title="Matches" borderTitleColor="blue" forceLessCols>
                    {team.homeMatches.map((match: any) => (
                        <MatchCard match={match} key={match.id}/>
                    ))}

                    {team.awayMatches.map((match: any) => (
                        <MatchCard match={match} key={match.id}/>
                    ))}
                </CardGrid>
            </div>
        </Container>
    )
}
