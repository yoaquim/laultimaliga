import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
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
    noTopRadius?: boolean
}

export default function MatchCard({match, noTopRadius}: Props) {
    const dateStr = new Date(match.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    // Show scoreboard if Ongoing or Completed
    const isScoreVisible = match.status === 'COMPLETED'
    // We'll color the scoreboard green if ONGOING, blue if COMPLETED
    const scoreColor =
        match.status === 'ONGOING' ? 'text-lul-green' : 'text-lul-blue'

    return (
        <Link
            key={match.id}
            href={`/dashboard/matches/${match.id}`}
            className={clsx('w-full relative flex flex-col h-full p-4 pb-2.5 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer gap-y-4', {
                'rounded-t-none': noTopRadius
            })}
        >
            {/* STATUS BADGE */}
            <div className="mx-auto px-3 py-1 rounded-md text-white text-sm font-bold uppercase" style={{backgroundColor: 'rgba(0,0,0,0.25)'}}>
                <div className={clsx({
                    'text-lul-yellow': match.status === 'SCHEDULED',
                    'text-lul-green': match.status === 'ONGOING',
                    'text-lul-blue': match.status === 'COMPLETED',
                    'text-lul-red': match.status === 'CANCELED',
                })}>
                    {match.status}
                </div>
            </div>

            {/* TEAMS */}
            <div className={clsx('flex-1 flex flex-col items-center justify-center gap-y-4')}>
                <div className="w-full -mt-8 flex items-center justify-between">
                    {/*HOME TEAM*/}
                    <div className="flex flex-col justify-center items-start">
                        <h1 className="w-full text-white text-base text-center font-bold uppercase">HOME</h1>
                        <img src={TEAM_LOGO_URL_BUILDER(match.homeTeam.logo)} alt="team-logo" className="h-24"/>
                    </div>

                    {/* BALL */}
                    {!isScoreVisible &&
                        <div className="flex items-center justify-center">
                            {match.status === 'CANCELED'
                                ? <div className="w-full text-center text-4xl">❌</div>
                                : (<img src="/ball.svg" alt="ball" className="w-8"/>)
                            }
                        </div>
                    }

                    {/* SCORE */}
                    {isScoreVisible &&
                        <div className={clsx('flex justify-center gap-x-1 text-3xl font-bold rounded text-white')
                        }>
                            <div className={clsx({
                                'text-lul-green': match.winnerId === match.homeTeam.id,
                                'text-lul-red': match.winnerId !== match.homeTeam.id
                            })}>
                                {match.homeScore}
                            </div>

                            <div>-</div>

                            <div className={clsx({
                                'text-lul-green': match.winnerId === match.awayTeam.id,
                                'text-lul-red': match.winnerId !== match.awayTeam.id
                            })}>
                                {match.awayScore}
                            </div>
                        </div>
                    }

                    {/*AWAY TEAM*/}
                    <div className="flex flex-col justify-center items-end ">
                        <h1 className="w-full text-white text-base text-center font-bold uppercase">AWAY</h1>
                        <img src={TEAM_LOGO_URL_BUILDER(match.awayTeam.logo)} alt="team-logo" className="h-24"/>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW (DATE & SEASON) */}
            <div className="flex justify-between items-center">
                <div className="text-white font-bold text-sm">{dateStr}</div>
                <div className="text-lul-blue text-sm font-semibold uppercase">
                    {match.season.shortName || match.season.name}
                </div>
            </div>
        </Link>
    )
}