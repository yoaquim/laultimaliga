import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { BUCKET_ENDPOINT, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import clsx from 'clsx'

// --------------------------------------------------
// Types
// --------------------------------------------------
type MatchWithTeams = Prisma.MatchGetPayload<{
    include: {
        season: true
        homeTeam: true
        awayTeam: true
    }
}>

interface Props {
    match: MatchWithTeams
}

export default function MatchCard({match}: Props) {
    const dateStr = new Date(match.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    // Show scoreboard if Ongoing or Completed
    const isScoreVisible =
        match.status === 'ONGOING' || match.status === 'COMPLETED'
    // We'll color the scoreboard green if ONGOING, blue if COMPLETED
    const scoreColor =
        match.status === 'ONGOING' ? 'text-lul-green' : 'text-lul-blue'

    return (
        <Link
            key={match.id}
            href={`/dashboard/matches/${match.id}`}
            className="w-full relative flex flex-col h-full p-4 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer gap-y-4"
        >
            {/* STATUS BADGE - pinned top-right */}
            <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-md text-white text-sm font-bold uppercase" style={{backgroundColor: 'rgba(0,0,0,0.25)'}}>
                <div className={clsx({
                    'text-lul-yellow': match.status === 'SCHEDULED',
                    'text-lul-green': match.status === 'ONGOING',
                    'text-lul-blue': match.status === 'COMPLETED',
                    'text-lul-red': match.status === 'CANCELED',
                })}
                >
                    {match.status}
                </div>
            </div>

            {/* SCORE */}
            {isScoreVisible &&
                <div className={clsx('w-full flex justify-center gap-x-1 text-3xl font-bold rounded', {
                    'text-lul-green': match.status === 'ONGOING',
                    'text-lul-blue': match.status === 'COMPLETED',
                })
                }>
                    <div>{match.homeScore}</div>
                    <div>-</div>
                    <div>{match.awayScore}</div>
                </div>
            }

            {/* TEAMS */}
            <div className={clsx('flex-1 flex flex-col items-center justify-center gap-y-4', {
                'pt-8': !isScoreVisible
            })}>
                <div className="w-full flex items-center justify-between">
                    {/*HOME TEAM*/}
                    <div className="flex flex-col justify-center items-start">
                        <img src={TEAM_LOGO_URL_BUILDER(match.homeTeam.logo)} alt="team-logo" className="h-24"/>
                    </div>

                    {!isScoreVisible &&
                        <div className="flex items-center justify-center">
                            {match.status === 'CANCELED'
                                ? <div className="w-full text-center text-4xl">❌</div>
                                : (<img src="/ball.svg" alt="ball" className="w-8"/>)
                            }
                        </div>
                    }

                    {/*AWAY TEAM*/}
                    <div className="flex flex-col justify-center items-end">
                        <img src={TEAM_LOGO_URL_BUILDER(match.awayTeam.logo)} alt="team-logo" className="h-24"/>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW (DATE & SEASON) */}
            <div className="flex justify-between items-center">
                <div className="text-white font-bold text-sm">{dateStr}</div>
                <div className="text-lul-orange text-sm font-semibold uppercase">
                    {match.season.shortName || match.season.name}
                </div>
            </div>
        </Link>
    )
}